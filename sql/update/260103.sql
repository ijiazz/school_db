-- 创建新增表

CREATE TABLE sys.file (
    bucket VARCHAR NOT NULL, -- 存储桶
    filename VARCHAR NOT NULL, -- 文件路径
    size INT NOT NULL,   --文件大小
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash VARCHAR NOT NULL,
    ref_count INT NOT NULL DEFAULT 0,
    media_type media_type NULL,
    meta JSONB NOT NULL, -- 资源元数据
    PRIMARY KEY (bucket, filename),
    CONSTRAINT args CHECK(meta IS NULL OR jsonb_typeof(meta)='object'),
    CONSTRAINT path_no_sp CHECK(position('/' in filename) = 0)
);
CREATE INDEX idx_sys_file_ref_count ON sys.file(ref_count);
CREATE INDEX idx_sys_file_media_type ON sys.file(media_type);
CREATE INDEX idx_sys_file_meta ON sys.file USING GIN (meta);

CREATE TABLE sys.file_operation(
    bucket VARCHAR NOT NULL, -- 存储桶
    filename VARCHAR NOT NULL, -- 文件路径
    to_bucket VARCHAR, -- 目标存储桶（仅在移动操作中使用）
    to_path VARCHAR, -- 目标文件路径（仅在移动操作中使用）
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bucket, filename),
    CONSTRAINT path_no_sp CHECK(position('/' in filename) = 0)
);

-- 根据新旧值处理资源引用数量的更新
CREATE OR REPLACE FUNCTION sys.file_update_ref_count(
    old_bucket VARCHAR, old_filename VARCHAR,
    new_bucket VARCHAR, new_filename VARCHAR,
    ensure_new_exists BOOLEAN DEFAULT TRUE)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    tmp_row_count INTEGER;
BEGIN
    IF (old_bucket IS NOT DISTINCT FROM new_bucket AND old_filename IS NOT DISTINCT FROM new_filename) THEN
        RETURN 0;
    END IF;

    IF (old_filename IS NOT NULL) THEN
        IF (old_bucket IS NULL) THEN
            RAISE EXCEPTION 'Invalid old_bucket(%,%): old_filename 不为空时，old_bucket 也不能为空', old_bucket, old_filename;
        END IF;
        UPDATE sys.file
        SET ref_count = ref_count - 1
        WHERE bucket = old_bucket AND filename = old_filename;
        GET DIAGNOSTICS tmp_row_count = ROW_COUNT;
        v_count := v_count + tmp_row_count;
    END IF;

    IF (new_filename IS NOT NULL) THEN
        IF (new_bucket IS NULL) THEN
            RAISE EXCEPTION 'Invalid new_bucket(%,%): new_filename 不为空时，new_bucket 也不能为空', new_bucket, new_filename;
        END IF;
        UPDATE sys.file
        SET ref_count = ref_count + 1
        WHERE bucket = new_bucket AND filename = new_filename;
        GET DIAGNOSTICS tmp_row_count = ROW_COUNT;

        IF(ensure_new_exists AND tmp_row_count=0) THEN
            RAISE EXCEPTION '引用了不存在的文件 (%, %)', new_bucket, new_filename;
        END IF;

        v_count := v_count + tmp_row_count;
    END IF;



    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 根据新旧值处理资源引用数量的更新
CREATE OR REPLACE FUNCTION sys.file_update_ref_count(old_filepath VARCHAR, new_filepath VARCHAR, ensure_new_exists BOOLEAN DEFAULT TRUE)
RETURNS INTEGER AS $$
DECLARE
    old_bucket VARCHAR;
    old_filename VARCHAR;
    new_bucket VARCHAR;
    new_filename VARCHAR;
BEGIN

    IF (old_filepath IS NOT DISTINCT FROM new_filepath) THEN
        RETURN 0;
    END IF;

    old_bucket=regexp_replace(old_filepath, '/[^/]+$', '');
    old_filename=regexp_replace(old_filepath, '^.+/', '');
    new_bucket=regexp_replace(new_filepath, '/[^/]+$', '');
    new_filename=regexp_replace(new_filepath, '^.+/', '');
  
    RETURN sys.file_update_ref_count(old_bucket, old_filename, new_bucket, new_filename, ensure_new_exists);
END;
$$ LANGUAGE plpgsql; 


CREATE SCHEMA IF NOT EXISTS pla;
CREATE TABLE pla.asset_comment_media(
    platform platform_flag NOT NULL,
    comment_id VARCHAR NOT NULL,
    index INT NOT NULL, -- 作品在列表中的索引
    level media_level NOT NULL, -- 媒体质量等级
    filename VARCHAR, -- 如果为空，表示未录入

    FOREIGN KEY (platform, comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE SET NULL,
    PRIMARY KEY (platform, comment_id, index, level)
);
CREATE TABLE pla.asset_media(
    platform platform_flag NOT NULL,
    asset_id VARCHAR NOT NULL,
    index INT NOT NULL, -- 作品在列表中的索引
    level media_level NOT NULL, -- 媒体质量等级
    media_type media_type,
    filename VARCHAR, -- 如果为空，表示未录入
    
    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE SET NULL,
    PRIMARY KEY (platform, asset_id,index,level)
);

---------------------
-- 修改 pla_comment 表
---------------------

-- 迁移评论图片数据到 sys.file
INSERT INTO sys.file(bucket,filename,hash,size,ref_count, media_type,meta)
SELECT 
    CASE SUBSTRING(id,1,4) WHEN 'img-' THEN 'comment_img' WHEN 'emo-' THEN 'emotion' ELSE 'comment_img' END AS bucket,
    regexp_replace(id, '^(img|emo)-', '') filename,
    regexp_replace(regexp_replace(id, '^(img|emo)-', ''),'\..*$','')  hash, 
    COALESCE(size,0), ref_count, 'image' media_type,
    jsonb_build_object('width', image_width, 'height', image_height) meta
FROM comment_image;
 
-- 迁移评论图片关联数据到 pla.asset_comment_media
WITH tb AS(
    SELECT 'origin'::media_level AS level, c.platform, c.comment_id, r.* FROM pla_comment AS c
    INNER JOIN comment_image AS r ON c.additional_image = r.id
    UNION ALL
    SELECT 'thumb'::media_level AS level, c.platform, c.comment_id, r.* FROM pla_comment AS c
    INNER JOIN comment_image AS r ON c.additional_image_thumb = r.id
), f AS(
    SELECT  platform, comment_id, level, 
    (CASE SUBSTRING(id,1,4) WHEN 'img-' THEN 'comment_img' WHEN 'emo-' THEN 'emotion' ELSE 'comment_img' END) AS bucket,
    regexp_replace(id, '^(img|emo)-', '') AS filename
    FROM tb
)
INSERT INTO pla.asset_comment_media(platform,comment_id,index,level,filename)
SELECT platform, comment_id, 0 index, level, bucket||'/'||filename AS filename FROM f;

-- 清理索引、触发器、列、外键约束
DROP TRIGGER sync_pla_comment_resource_ref_count ON pla_comment;
DROP FUNCTION pla_comment_resource_ref_sync();

ALTER TABLE pla_comment
    DROP COLUMN additional_image,
    DROP COLUMN additional_image_thumb;
DROP TABLE comment_image;

CREATE FUNCTION pla.fn_sync_asset_comment_media_file_ref_count() RETURNS TRIGGER AS $$
BEGIN
    PERFORM sys.file_update_ref_count(OLD.filename, NEW.filename); 
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;


CREATE TRIGGER sync_asset_comment_media_file_ref_count
AFTER INSERT OR DELETE OR UPDATE
ON pla.asset_comment_media FOR EACH ROW EXECUTE FUNCTION pla.fn_sync_asset_comment_media_file_ref_count();

---------------------
-- 修改 pla_asset 表
--------------------
DROP TRIGGER sync_pla_asset_resource_ref_count ON pla_asset;

with tb AS(
    SELECT user_avatar_snapshot,sum(1) FROM pla_asset
    WHERE user_avatar_snapshot IS NOT NULL
    GROUP BY user_avatar_snapshot
)
UPDATE user_avatar AS u SET ref_count = u.ref_count - t.sum
FROM tb AS t
WHERE u.id = t.user_avatar_snapshot;


ALTER TABLE pla_asset 
    DROP COLUMN user_name_snapshot,
    DROP COLUMN user_avatar_snapshot; -- 删除前清理引用计数

INSERT INTO sys.file(bucket,filename,hash,size, media_type,meta)
SELECT 'pla_post_media' bucket, (file_id||'.'||ext) filename, 
   (hash_type||'_'|| hash) hash, size, media_type, meta FROM pla_asset_media;

INSERT INTO pla.asset_media(platform,asset_id,index,level,filename,media_type)
SELECT platform,asset_id,index,'origin'::media_level, NULL, type FROM pla_asset_media_missing 
UNION ALL
SELECT platform,asset_id,index,level,file_id||'.'||ext,type FROM pla_asset_media;

DROP TABLE pla_asset_media;
DROP TABLE pla_asset_media_missing;

---------------------
-- 修改 pla_user 和 user 表
---------------------
DROP TRIGGER sync_user_resource_ref_count ON public.user;
DROP FUNCTION resource_ref_sync_user();
ALTER TABLE public.user DROP CONSTRAINT user_avatar_fkey;
DROP INDEX  idxfk_avatar;

DROP TRIGGER sync_pla_user_resource_ref_count ON pla_user;
DROP FUNCTION resource_ref_sync(); 
ALTER TABLE pla_user DROP CONSTRAINT pla_user_avatar_fkey;
DROP INDEX  idx_pla_user_avatar;

CREATE FUNCTION pla.fn_sync_user_avatar_file_ref_count() RETURNS TRIGGER AS $$
BEGIN
    PERFORM sys.file_update_ref_count('avatar', OLD.avatar,'avatar', NEW.avatar); 
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;
CREATE TRIGGER sync_pla_user_avatar_file_ref_count
AFTER INSERT OR DELETE OR UPDATE
ON pla_user FOR EACH ROW EXECUTE FUNCTION pla.fn_sync_user_avatar_file_ref_count();

CREATE FUNCTION fn_sync_user_avatar_file_ref_count() RETURNS TRIGGER AS $$
BEGIN
    PERFORM sys.file_update_ref_count('avatar', OLD.avatar, 'avatar', NEW.avatar); 
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;
CREATE TRIGGER sync_user_avatar_file_ref_count
AFTER INSERT OR DELETE OR UPDATE
ON public.user FOR EACH ROW EXECUTE FUNCTION fn_sync_user_avatar_file_ref_count();


INSERT INTO sys.file(bucket,filename,size,hash,media_type,meta,ref_count)
SELECT 'avatar', id, COALESCE(size,0),
    regexp_replace(id,'\..*$','') hash, 'image'::media_type,
    jsonb_build_object('width', image_width, 'height', image_height),
    ref_count
FROM user_avatar;

DROP TABLE user_avatar;


CREATE INDEX idx_pla_user_extra ON pla_user USING GIN (extra);



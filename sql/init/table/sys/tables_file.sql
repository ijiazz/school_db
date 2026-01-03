SET client_encoding = 'UTF8';

CREATE TYPE media_level AS ENUM('origin','thumb');
CREATE TYPE media_type AS ENUM('video','audio','image'); -- 资源类型


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

 
-- from == to: create  to == null: delete , from !=to: move
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

/* 

create: 
1. 上传文件到临时目录
2. 记录操作到 sys.file_operation
3. 把文件从临时目录移动到目标目录，
4. 更新 sys.file 并删除 sys.file_operation 记录
 
update: 

1. 记录操作到 sys.file_operation
3. 把文件从原路径移动到到目标目录
4. 更新 sys.file 并删除 sys.file_operation 记录

delete:
1. 记录操作到 sys.file_operation
2. 删除文件
3. 更新 sys.file 并删除 sys.file_operation 记录


 */
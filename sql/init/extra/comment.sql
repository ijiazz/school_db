/*
扩展评论功能 
 */

SET client_encoding = 'UTF8';

CREATE TABLE comment_image (
    id VARCHAR PRIMARY KEY,

    size INT,
    image_width SMALLINT,
    image_height SMALLINT,

    ref_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_comment_image_ref_count ON comment_image(ref_count);
CREATE INDEX idx_comment_image_size ON comment_image(size);

CREATE TABLE pla_comment (
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    crawl_check_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    reply_last_sync_date TIMESTAMPTZ, -- 最后同步评论回复的时间
    extra JSONB NOT NULL DEFAULT '{}', -- 扩展信息, 不同平台结构不一样
    --
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    platform_delete BOOLEAN NOT NULL DEFAULT FALSE,
    --
    content_text VARCHAR,
    content_text_struct JSONB, -- 文本扩展信息
    user_name_snapshot VARCHAR,
    user_avatar_snapshot VARCHAR REFERENCES user_avatar(id),
    comment_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
    additional_image VARCHAR REFERENCES comment_image(id) ON UPDATE CASCADE, -- 评论附带图片
    additional_image_thumb VARCHAR REFERENCES comment_image(id) ON UPDATE CASCADE, -- 评论附带图片缩略图
    publish_time TIMESTAMPTZ,
    ip_location VARCHAR,
    reply_count INT, -- 回复数量
    like_count INTEGER,
    author_like BOOLEAN, -- 作者赞过
    --
    pla_uid VARCHAR,
    comment_id VARCHAR,
    root_comment_id VARCHAR, -- 根评论 id
    parent_comment_id VARCHAR, -- 回复评论 id
    asset_id VARCHAR NOT NULL,
    platform platform_flag NOT NULL,
    PRIMARY KEY (platform, comment_id),
    FOREIGN KEY (platform, root_comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    -- FOREIGN KEY (platform, parent_comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
CREATE INDEX idxfk_pla_comment_root_comment_id ON pla_comment(platform, root_comment_id);
CREATE INDEX idxfk_pla_comment_parent_comment_id ON pla_comment(platform, parent_comment_id);
CREATE INDEX idxfk_pla_comment_asset_id ON pla_comment(platform, asset_id);
CREATE INDEX idxfk_pla_comment_pla_uid ON pla_comment(platform, pla_uid);
CREATE INDEX idxfk_pla_comment_user_avatar_snapshot ON pla_comment USING hash(user_avatar_snapshot);
CREATE INDEX idxfk_pla_comment_user_additional_image ON pla_comment USING hash(additional_image);
CREATE INDEX idxfk_pla_comment_user_additional_image_thumb ON pla_comment USING hash(additional_image_thumb);

CREATE INDEX idx_pla_comment_crawl_check_time ON pla_comment(crawl_check_time);
CREATE INDEX idx_pla_comment_reply_last_sync_date ON pla_comment(reply_last_sync_date);

CREATE INDEX idx_pla_comment_is_delete ON pla_comment(is_delete);
CREATE INDEX idx_pla_comment_platform_delete ON pla_comment(platform_delete);

  

CREATE FUNCTION pla_comment_resource_ref_sync() RETURNS TRIGGER AS $$
BEGIN
    CASE TG_TABLE_NAME
    
    WHEN 'pla_comment' THEN
        PERFORM res_update_operate(OLD.user_avatar_snapshot, NEW.user_avatar_snapshot,'user_avatar');
        PERFORM res_update_operate(OLD.additional_image, NEW.additional_image,'comment_image');
        PERFORM res_update_operate(OLD.additional_image_thumb, NEW.additional_image_thumb,'comment_image');
    ELSE
        RAISE '不支持的触发表 %', TG_TABLE_NAME;
    END CASE;
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;


CREATE TRIGGER sync_pla_comment_resource_ref_count -- 评论头像快照 和 评论图片引用
AFTER INSERT OR DELETE OR UPDATE
ON pla_comment FOR EACH ROW EXECUTE FUNCTION pla_comment_resource_ref_sync ();
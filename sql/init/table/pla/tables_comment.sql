/*
扩展评论功能 
 */

SET client_encoding = 'UTF8';


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
    comment_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
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

CREATE INDEX idx_pla_comment_crawl_check_time ON pla_comment(crawl_check_time);
CREATE INDEX idx_pla_comment_reply_last_sync_date ON pla_comment(reply_last_sync_date);

CREATE INDEX idx_pla_comment_is_delete ON pla_comment(is_delete);
CREATE INDEX idx_pla_comment_platform_delete ON pla_comment(platform_delete);


/* 
  bucket: "comment_img"
  path: filename
 */
CREATE TABLE pla.asset_comment_media(
    platform platform_flag NOT NULL,
    comment_id VARCHAR NOT NULL,
    index INT NOT NULL, -- 作品在列表中的索引
    level media_level NOT NULL, -- 媒体质量等级
    filename VARCHAR, -- 如果为空，表示未录入

    FOREIGN KEY (platform, comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE SET NULL,
    PRIMARY KEY (platform, comment_id, index, level)
);


CREATE FUNCTION pla.fn_sync_asset_comment_media_file_ref_count() RETURNS TRIGGER AS $$
BEGIN
    PERFORM sys.file_update_ref_count(OLD.filename, NEW.filename); 
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;


CREATE TRIGGER sync_asset_comment_media_file_ref_count
AFTER INSERT OR DELETE OR UPDATE
ON pla.asset_comment_media FOR EACH ROW EXECUTE FUNCTION pla.fn_sync_asset_comment_media_file_ref_count();
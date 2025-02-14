SET client_encoding = 'UTF8';

CREATE TYPE platform_flag AS ENUM('douyin','bilibili','xiaohonshu','weibo','v5sing','wangyiyun');
CREATE TYPE media_level AS ENUM('origin','thumb');

----------
-- 用户相关
----------
CREATE TABLE user_avatar (
    id VARCHAR PRIMARY KEY,
    ref_count INTEGER NOT NULL DEFAULT 0,
    image_width SMALLINT,
    image_height SMALLINT,
    size INT
);

CREATE INDEX idx_user_avatar_ref_count ON user_avatar(ref_count);
CREATE INDEX idx_user_avatar_size ON user_avatar(size);

CREATE TABLE pla_user (
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 数据创建时间
    crawl_check_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 爬虫最后一次检测时间
    extra JSONB NOT NULL DEFAULT '{}', -- 扩展信息, 不同平台结构不一样
    pla_avatar_uri VARCHAR, -- 平台用户头像 uri
    -- 
    user_name VARCHAR, -- 用户名称
    ip_location VARCHAR, -- IP归属地
    avatar VARCHAR REFERENCES user_avatar(id) ON UPDATE CASCADE, -- 用户头像id

    pla_uid VARCHAR, -- 平台用户id
    platform platform_flag NOT NULL, -- 来源平台
    follower_count INT, -- 粉丝数
    following_count INT, -- 关注数
    signature VARCHAR, -- 用户签名
    signature_struct JSONB, -- 签名扩展信息
    PRIMARY KEY (platform, pla_uid),
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
CREATE INDEX idx_pla_user_avatar ON pla_user USING hash(avatar);
CREATE INDEX idx_pla_user_user_name ON pla_user (user_name);

CREATE TABLE watching_pla_user (
    published_last_full_update_time TIMESTAMPTZ, -- 最后一次全量同步作品的时间
    published_last_update_time TIMESTAMPTZ, -- 最后一次同步作品的时间
    level SMALLINT, -- 权重
    disabled BOOLEAN,
    pla_uid VARCHAR NOT NULL, -- 平台用户id
    platform platform_flag NOT NULL, -- 来源平台
    PRIMARY KEY (platform, pla_uid),
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE
);
CREATE INDEX idxfk_watching_pla_user_pla_uid ON watching_pla_user(platform, pla_uid);
CREATE INDEX idx_watching_pla_user_published_last_full_update_time ON watching_pla_user(published_last_full_update_time, level);
CREATE INDEX idx_watching_pla_user_published_last_update_time ON watching_pla_user(published_last_update_time, level);

----------
-- 作品相关
----------

CREATE TABLE pla_asset (
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    crawl_check_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    extra JSONB NOT NULL DEFAULT '{}', -- 扩展信息, 不同平台结构不一样
    -- 
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    platform_delete BOOLEAN NOT NULL DEFAULT FALSE,
    --
    publish_time TIMESTAMPTZ, -- 作品发布时间
    content_text VARCHAR, -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息
    content_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
    user_name_snapshot VARCHAR,
    user_avatar_snapshot VARCHAR REFERENCES user_avatar(id) ON UPDATE CASCADE,
    ip_location VARCHAR, -- IP归属地
    like_count INTEGER, -- 点赞数量
    comment_num INTEGER, -- 评论数量
    collection_num INTEGER, -- 收藏数量
    forward_num INTEGER, -- 转发数量
    --
    pla_uid VARCHAR NOT NULL,
    asset_id VARCHAR,
    platform platform_flag,
    PRIMARY KEY (platform, asset_id),
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
CREATE INDEX idxfk_pla_asset_pla_uid ON pla_asset(platform, pla_uid);
CREATE INDEX idxfk_pla_asset_user_avatar_snapshot ON pla_asset USING hash(user_avatar_snapshot);

CREATE INDEX idx_pla_asset_crawl_check_time ON pla_asset(crawl_check_time);

CREATE INDEX idx_pla_asset_is_delete ON pla_asset(is_delete);
CREATE INDEX idx_pla_asset_platform_delete ON pla_asset(platform_delete);
CREATE INDEX idx_pla_asset_publish_time ON pla_asset(publish_time);
CREATE INDEX idx_pla_asset_content_text ON pla_asset(content_text);
CREATE INDEX idx_pla_asset_content_type ON pla_asset(content_type);
CREATE INDEX idx_pla_asset_like_count ON pla_asset(like_count);

CREATE TABLE watching_pla_asset (
    comment_last_full_update_time TIMESTAMPTZ, -- 最后一次全量同步评论的时间
    comment_last_update_time TIMESTAMPTZ, -- 最后一次同步评论的时间
    asset_id VARCHAR,
    platform platform_flag,
    disabled BOOLEAN,
    PRIMARY KEY (platform, asset_id),
    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_watching_pla_asset_comment_last_full_update_time ON watching_pla_asset(comment_last_full_update_time);
CREATE INDEX idx_watching_pla_asset_comment_last_update_time ON watching_pla_asset(comment_last_update_time);


CREATE TABLE asset_image (
    platform platform_flag,
    asset_id VARCHAR,
    uri VARCHAR PRIMARY KEY,
    index SMALLINT, -- 索引。如果为空，则不显示在作品资源下

    size INT, --文件大小
    level media_level, -- 媒体质量等级

    width SMALLINT,
    height SMALLINT,

    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idxfk_asset_image_pid ON asset_image(platform, asset_id);

CREATE TABLE asset_audio (
    platform platform_flag,
    asset_id VARCHAR,
    uri VARCHAR PRIMARY KEY,
    index SMALLINT, -- 索引。

    size INT,
    level media_level,
    format VARCHAR(20),

    duration INTEGER,

    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idxfk_asset_audio_pid ON asset_audio(platform, asset_id);

CREATE TABLE asset_video (
    platform platform_flag,
    asset_id VARCHAR,
    uri VARCHAR PRIMARY KEY,
    index SMALLINT, -- 索引。

    size INT,
    level media_level,
    format VARCHAR(20), --格式 h264/h265

    frame_num INTEGER, --帧数
    width SMALLINT,
    height SMALLINT,
    fps SMALLINT,   --帧速率
    bit_rate INT, --比特率

    FOREIGN KEY (platform, asset_id) REFERENCES pla_asset (platform, asset_id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idxfk_asset_video_pid ON asset_video(platform, asset_id);

----------
----------

CREATE TYPE crawl_task_status AS ENUM('waiting', 'processing', 'success', 'failed', 'hide');

CREATE TABLE crawl_task_queue (
    task_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    creator VARCHAR,
    level SMALLINT NOT NULL DEFAULT 0,
    platform platform_flag NOT NULL,
    args JSONB NOT NULL,
    result JSONB,
    errors JSONB,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    exec_time TIMESTAMPTZ,
    last_update_time TIMESTAMPTZ NOT NULL DEFAULT now(),-- 最后更新结果的时间
    status crawl_task_status NOT NULL DEFAULT 'waiting',
    CONSTRAINT args CHECK(jsonb_typeof(args)='object'),
    CONSTRAINT result CHECK(jsonb_typeof(result)='object'),
    CONSTRAINT errors CHECK(jsonb_typeof(errors)='array')
);

CREATE INDEX idx_crawl_task_queue ON crawl_task_queue(status, platform, level);


CREATE VIEW crawl_task_priority_queue AS
SElECT
    task_id,
    platform,
    args,
    create_time,
    level,
    creator,
    name
FROM crawl_task_queue
WHERE
    status = 'waiting';
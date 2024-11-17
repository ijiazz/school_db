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
    follower_count INT, -- 粉丝数
    following_count INT, -- 关注数
    signature VARCHAR, -- 用户签名
    platform platform_flag NOT NULL, -- 来源平台
    PRIMARY KEY (platform, pla_uid),
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
CREATE INDEX idx_pla_user_avatar ON pla_user USING hash(avatar);
CREATE INDEX idx_pla_user_user_name ON pla_user (user_name);

CREATE TABLE watching_pla_user (
    published_last_full_update_time TIMESTAMPTZ, -- 最后一次全量同步作品的时间
    published_last_update_time TIMESTAMPTZ, -- 最后一次同步作品的时间
    level SMALLINT, -- 权重
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

CREATE TABLE pla_published (
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    crawl_check_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    comment_last_full_update_time TIMESTAMPTZ, -- 最后一次全量同步评论的时间
    comment_last_update_time TIMESTAMPTZ, -- 最后一次同步评论的时间
    extra JSONB NOT NULL DEFAULT '{}', -- 扩展信息, 不同平台结构不一样
    -- 
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    platform_delete BOOLEAN NOT NULL DEFAULT FALSE,
    --
    publish_time TIMESTAMPTZ, -- 作品发布时间
    content_text VARCHAR, -- 内容文本
    content_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
    user_name_snapshot VARCHAR,
    user_avatar_snapshot VARCHAR REFERENCES user_avatar(id) ON UPDATE CASCADE,
    ip_location VARCHAR, -- IP归属地
    like_count INTEGER, -- 点赞数量
    collection_num INTEGER, -- 收藏数量
    forward_num INTEGER, -- 转发数量
    --
    pla_uid VARCHAR NOT NULL,
    published_id VARCHAR,
    platform platform_flag,
    PRIMARY KEY (platform, published_id),
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
CREATE INDEX idxfk_pla_published_pla_uid ON pla_published(platform, pla_uid);
CREATE INDEX idxfk_pla_published_user_avatar_snapshot ON pla_published USING hash(user_avatar_snapshot);

CREATE INDEX idx_pla_published_crawl_check_time ON pla_published(crawl_check_time);
CREATE INDEX idx_pla_published_comment_last_full_update_time ON pla_published(comment_last_full_update_time);
CREATE INDEX idx_pla_published_comment_last_update_time ON pla_published(comment_last_update_time);

CREATE INDEX idx_pla_published_is_delete ON pla_published(is_delete);
CREATE INDEX idx_pla_published_platform_delete ON pla_published(platform_delete);
CREATE INDEX idx_pla_published_publish_time ON pla_published(publish_time);
CREATE INDEX idx_pla_published_content_text ON pla_published(content_text);
CREATE INDEX idx_pla_published_content_type ON pla_published(content_type);
CREATE INDEX idx_pla_published_like_count ON pla_published(like_count);

CREATE TABLE published_image (
    platform platform_flag,
    published_id VARCHAR,
    uri VARCHAR PRIMARY KEY,
    index SMALLINT, -- 索引。如果为空，则不显示在作品资源下

    size INT, --文件大小
    level media_level, -- 媒体质量等级

    width SMALLINT,
    height SMALLINT,

    FOREIGN KEY (platform, published_id) REFERENCES pla_published (platform, published_id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idxfk_published_image_pid ON published_image(platform, published_id);

CREATE TABLE published_audio (
    platform platform_flag,
    published_id VARCHAR,
    uri VARCHAR PRIMARY KEY,
    index SMALLINT, -- 索引。

    size INT,
    level media_level,
    format VARCHAR(20),

    duration INTEGER,

    FOREIGN KEY (platform, published_id) REFERENCES pla_published (platform, published_id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idxfk_published_audio_pid ON published_audio(platform, published_id);

CREATE TABLE published_video (
    platform platform_flag,
    published_id VARCHAR,
    uri VARCHAR PRIMARY KEY,
    index SMALLINT, -- 索引。

    size INT,
    level media_level,
    format VARCHAR(20), --格式 h264/h265

    duration INTEGER, --时长
    width SMALLINT,
    height SMALLINT,
    fps SMALLINT,   --帧速率
    bit_rate SMALLINT, --比特率

    FOREIGN KEY (platform, published_id) REFERENCES pla_published (platform, published_id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idxfk_published_video_pid ON published_video(platform, published_id);

----------
----------

----------
-- 评论相关
----------
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
    user_name_snapshot VARCHAR,
    user_avatar_snapshot VARCHAR REFERENCES user_avatar(id),
    comment_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
    additional_image VARCHAR REFERENCES comment_image(id) ON UPDATE CASCADE, -- 评论附带图片
    additional_image_thumb VARCHAR REFERENCES comment_image(id) ON UPDATE CASCADE, -- 评论附带图片缩略图
    publish_time TIMESTAMPTZ,
    ip_location VARCHAR,
    like_count INTEGER,
    author_like BOOLEAN, -- 作者赞过
    --
    pla_uid VARCHAR,
    comment_id VARCHAR,
    root_comment_id VARCHAR, -- 根评论 id
    parent_comment_id VARCHAR, -- 回复评论 id
    published_id VARCHAR NOT NULL,
    platform platform_flag NOT NULL,
    PRIMARY KEY (platform, comment_id),
    FOREIGN KEY (platform, root_comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    -- FOREIGN KEY (platform, parent_comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, published_id) REFERENCES pla_published (platform, published_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
CREATE INDEX idxfk_pla_comment_root_comment_id ON pla_comment(platform, root_comment_id);
CREATE INDEX idxfk_pla_comment_parent_comment_id ON pla_comment(platform, parent_comment_id);
CREATE INDEX idxfk_pla_comment_published_id ON pla_comment(platform, published_id);
CREATE INDEX idxfk_pla_comment_pla_uid ON pla_comment(platform, pla_uid);
CREATE INDEX idxfk_pla_comment_user_avatar_snapshot ON pla_comment USING hash(user_avatar_snapshot);
CREATE INDEX idxfk_pla_comment_user_additional_image ON pla_comment USING hash(additional_image);
CREATE INDEX idxfk_pla_comment_user_additional_image_thumb ON pla_comment USING hash(additional_image_thumb);

CREATE INDEX idx_pla_comment_crawl_check_time ON pla_comment(crawl_check_time);
CREATE INDEX idx_pla_comment_reply_last_sync_date ON pla_comment(reply_last_sync_date);

CREATE INDEX idx_pla_comment_is_delete ON pla_comment(is_delete);
CREATE INDEX idx_pla_comment_platform_delete ON pla_comment(platform_delete);

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
SET client_encoding = 'UTF8';

CREATE TYPE platform_flag AS ENUM(
    'douyin',
    'bilibili',
    'xiaohonshu',
    'weibo',
    'v5sing',
    'wangyiyun'
);

CREATE TABLE file_image (
    uri VARCHAR PRIMARY KEY,
    ref_count INTEGER NOT NULL DEFAULT 0,
    image_width SMALLINT,
    image_height SMALLINT
);

CREATE TABLE file_video (
    uri VARCHAR PRIMARY KEY,
    ref_count INTEGER NOT NULL DEFAULT 0,
    cover_uri VARCHAR REFERENCES file_image (uri),
    video_width SMALLINT,
    video_height SMALLINT,
    format VARCHAR(20),
    duration INTEGER,
    fps SMALLINT
);

CREATE TABLE file_audio (
    uri VARCHAR PRIMARY KEY,
    ref_count INTEGER NOT NULL DEFAULT 0,
    format VARCHAR(20),
    duration INTEGER
);

CREATE TABLE pla_user (
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 数据创建时间
    crawl_check_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 爬虫最后一次检测时间
    published_last_full_update_time TIMESTAMPTZ, -- 最后一次全量同步作品的时间
    published_last_update_time TIMESTAMPTZ, -- 最后一次同步作品的时间
    extra JSONB NOT NULL DEFAULT '{}', -- 扩展信息, 不同平台结构不一样
    pla_avatar_uri VARCHAR, -- 平台用户头像 uri
    level SMALLINT NOT NULL DEFAULT -32768, -- 权重
    -- 
    user_name VARCHAR, -- 用户名称
    ip_location VARCHAR, -- IP归属地
    avatar VARCHAR REFERENCES file_image (uri), -- 用户头像uri

    pla_uid VARCHAR, -- 平台用户id
    platform platform_flag NOT NULL, -- 来源平台
    uid BIGINT, -- FK
    PRIMARY KEY (platform, pla_uid),
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);

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
    content_type SMALLINT NOT NULL DEFAULT 0, -- 0000_0000_0000_0000   低4位：有视频、有音频、有图片、有文本
    user_name_snapshot VARCHAR,
    user_avatar_snapshot VARCHAR REFERENCES file_image(uri),
    ip_location VARCHAR, -- IP归属地
    like_count INTEGER, -- 点赞数量
    collection_num INTEGER, -- 收藏数量
    forward_num INTEGER, -- 转发数量
    --
    cover_uri VARCHAR REFERENCES file_image (uri),
    image_uri VARCHAR[],
    video_uri VARCHAR[],
    audio_uri VARCHAR[],
    -- 
    pla_uid VARCHAR NOT NULL,
    published_id VARCHAR NOT NULL,
    platform platform_flag NOT NULL,
    PRIMARY KEY (platform, published_id),
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);

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
    user_avatar_snapshot VARCHAR REFERENCES file_image(uri),
    comment_type SMALLINT NOT NULL DEFAULT 0, -- 0000_0000_0000_0000   低4位：有视频、有音频、有图片、有文本
    image_uri VARCHAR[], -- 评论附带图片
    publish_time TIMESTAMPTZ,
    ip_location VARCHAR,
    like_count INTEGER,
    author_like BOOLEAN, -- 作者赞过
    --
    pla_uid VARCHAR NOT NULL,
    comment_id VARCHAR,
    platform platform_flag NOT NULL,
    root_comment_id VARCHAR, -- 根评论 id
    parent_comment_id VARCHAR, -- 回复评论 id
    published_id VARCHAR NOT NULL,
    PRIMARY KEY (platform, comment_id),
    FOREIGN KEY (platform, root_comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, parent_comment_id) REFERENCES pla_comment (platform, comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, published_id) REFERENCES pla_published (platform, published_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT extra CHECK(jsonb_typeof(extra)='object')
);
 
CREATE TYPE crawl_task_status AS ENUM(
    'waiting',
    'processing',
    'success',
    'failed'
);

CREATE TABLE crawl_task_queue (
    task_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    creator VARCHAR NOT NULL,
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
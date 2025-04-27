 
CREATE TABLE post_group(
    name VARCHAR(50) PRIMARY KEY, 
    description VARCHAR(500), -- 描述
    public_sort INT -- 如果为不为空，则显示在表白墙首页，根据数值排序
);

CREATE INDEX idx_post_group_public_sort ON post_group(public_sort); 

CREATE TABLE post (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(50) REFERENCES post_group(name),
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    publish_time TIMESTAMPTZ, -- 作品发布时间。如果为空则未发布
    content_text VARCHAR(10000), -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息
    content_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
    like_count INT NOT NULL DEFAULT 0, -- 点赞数量
    dislike_count INT NOT NULL DEFAULT 0, -- 举报数量
    comment_num INT  NOT NULL DEFAULT 0, -- 评论数量

    review_fail_count INT NOT NULL DEFAULT 0, -- 审核不通过数量
    review_pass_count INT NOT NULL DEFAULT 0, -- 审核通过数量
    is_reviewing BOOLEAN NOT NULL DEFAULT FALSE, -- 是否正在审核中
    is_review_pass BOOLEAN -- 是否审核通过
);

CREATE INDEX idxfk_post_group ON post(group_name,publish_time);
CREATE INDEX idx_post_publish_time ON post(publish_time);
CREATE INDEX idx_post_create_time ON post(create_time);
CREATE INDEX idx_post_user_insert_limit ON post(user_id,create_time);

CREATE TABLE post_review(
    post_update_time TIMESTAMPTZ NOT NULL, -- 更新次数
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    commit_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_pass BOOLEAN NOT NULL DEFAULT FALSE, -- 是否通过
    reason VARCHAR(100), -- 不通过的理由
    PRIMARY KEY (post_id,post_update_time,user_id)
);

CREATE INDEX idxfk_post_review_post_id ON post_review(post_id,commit_time);
CREATE INDEX idxfk_post_review_user_id ON post_review(user_id,commit_time);

CREATE TABLE post_asset(
    id SERIAL PRIMARY KEY,
    ext VARCHAR(10) NOT NULL, -- 扩展名
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,


    index INT NOT NULL, -- 作品在列表中的索引

    size INT, --文件大
    level media_level, -- 媒体质量等级

    type media_type NOT NULL, -- 资源类型
    meta JSONB NOT NULL, -- 资源元数据
    hash VARCHAR NOT NULL, -- 16进制hash值
    hash_type VARCHAR NOT NULL -- hash算法类型 
    
);
CREATE INDEX idxfk_post_asset_post_id ON post_asset(post_id,index);

CREATE TABLE post_like(
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id)ON DELETE CASCADE ON UPDATE CASCADE,
    is_like BOOLEAN NOT NULL DEFAULT TRUE, -- 如果为 true，则表示点赞；如果为 false，则表示举报
    reason VARCHAR(100), -- 举报需要一个理由
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);
CREATE INDEX idxfk_post_like_user_id ON post_like(user_id,create_time);

CREATE TABLE post_comment(
    id SERIAL PRIMARY KEY,
    root_comment_id INT REFERENCES post_comment(id) ON DELETE CASCADE,
    parent_comment_id INT NOT NULL REFERENCES post_comment(id) ON DELETE CASCADE,

    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    content_text VARCHAR(3000), -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息
    content_type BIT(8) NOT NULL DEFAULT 0::BIT(8) -- 0000_0000   低4位：有视频、有音频、有图片、有文本
);

CREATE INDEX idxfk_post_comment_post_id ON post_comment(post_id,root_comment_id,parent_comment_id,create_time);
CREATE INDEX idxfk_post_comment_user_id ON post_comment(user_id,is_delete);
CREATE INDEX idxfk_post_comment_parent_comment_id ON post_comment(parent_comment_id,create_time,is_delete);
CREATE INDEX idxfk_post_comment_root_comment_id ON post_comment(root_comment_id,parent_comment_id,create_time,is_delete);

CREATE INDEX idx_comment_user_insert_limit ON post_comment(user_id,create_time);

CREATE TABLE post_comment_like(
    comment_id INT NOT NULL REFERENCES post_comment(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_like BOOLEAN NOT NULL DEFAULT TRUE, -- 如果为 true，则表示点赞；如果为 false，则表示举报
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (comment_id, user_id)
);

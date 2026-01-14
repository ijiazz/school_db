 
CREATE TABLE post_group(
    id VARCHAR(50) PRIMARY KEY, 
    description VARCHAR(500), -- 描述
    count INT NOT NULL DEFAULT 0, -- 组内帖子数量
    reviewing_count INT NOT NULL DEFAULT 0 -- 正在审核中的帖子数量
);

CREATE TABLE post (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES post_group(id),
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    is_hide BOOLEAN NOT NULL DEFAULT FALSE, -- 是否隐藏
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    publish_time TIMESTAMPTZ, -- 作品发布时间。如果为空则未发布
    content_text VARCHAR(10000), -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息
    content_type BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   低4位：有视频、有音频、有图片、有文本
    like_count INT NOT NULL DEFAULT 0, -- 点赞数量 
    dislike_count SMALLINT NOT NULL DEFAULT 0, -- 异常阈值。当值达到100时，会触发人工审核。举报会提高这个数值
    comment_num INT  NOT NULL DEFAULT 0, -- 评论数量
    options BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   高1~2位:  是否匿名，是否关闭评论

    is_reviewing BOOLEAN NOT NULL DEFAULT FALSE, -- 是否正在审核中
    is_review_pass BOOLEAN -- 是否审核通过
);

CREATE INDEX idx_post_get_list ON post(group_id,publish_time,id,is_delete,is_hide); -- 查询帖子列表
CREATE INDEX idx_post_user_insert_limit ON post(group_id,user_id,create_time); -- 查询某个用户每天已发布的作品数量

CREATE TABLE post_asset(
    id SERIAL PRIMARY KEY,
    ext VARCHAR(10) NOT NULL, -- 扩展名
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,


    index INT NOT NULL, -- 作品在列表中的索引

    size INT NOT NULL, --文件大
    level media_level, -- 媒体质量等级

    type media_type NOT NULL, -- 资源类型
    meta JSONB NOT NULL, -- 资源元数据
    hash VARCHAR NOT NULL, -- 16进制hash值
    hash_type VARCHAR(10) NOT NULL -- hash算法类型 
    
);
CREATE INDEX idxfk_post_asset_post_id ON post_asset(post_id,index);

CREATE TABLE post_like(
    post_group_id VARCHAR(50) REFERENCES post_group(id) ON DELETE CASCADE,
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id)ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight SMALLINT NOT NULL, -- 点赞权重，举报为负数。如果过大于0则为点赞，过小于0则为举报。这个值可以用于以后推荐
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT chk_post_like_weight CHECK (weight !=0) -- 权重范围
);
CREATE INDEX idxfk_post_like_user_id ON post_like(post_group_id,user_id,weight,create_time); -- 查询某个用户喜欢列表和举报列表


CREATE TABLE user_post_group_stat(
    post_group_id VARCHAR(50) REFERENCES post_group(id) ON DELETE CASCADE,
    user_id INT PRIMARY KEY REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    post_count INT NOT NULL DEFAULT 0, -- 发帖数
    post_like_count INT NOT NULL DEFAULT 0, -- 用户点赞的总帖子数
    post_like_get_count INT NOT NULL DEFAULT 0,
    
    PRIMARY KEY (user_id, post_group_id)
);
CREATE INDEX idx_post_group_public_sort ON post_group(public_sort); 


CREATE TABLE post_review(
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    group_id INT NOT NULL REFERENCES post_group(id) ON DELETE CASCADE,
    target_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    reason VARCHAR(100), -- 审核意见
    is_pass BOOLEAN NOT NULL DEFAULT FALSE, -- 是否通过
    PRIMARY KEY (user_id, target_id) 
);
 
CREATE TABLE post_group(
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50) NOT NULL, 
    description VARCHAR(500), -- 描述
    public_sort SMALLINT -- 如果为不为空，则显示在表白墙首页，根据数值排序
);

CREATE INDEX idx_post_group_public_sort ON post_group(public_sort); 

CREATE TABLE post (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES post_group(id),
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
    dislike_count INT NOT NULL DEFAULT 0, -- 举报数量需要除以100，如果1人举报，则为100
    comment_num INT  NOT NULL DEFAULT 0, -- 评论数量
    options BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   高1位:  是否匿名

    review_fail_count INT NOT NULL DEFAULT 0, -- 审核通过数量
    review_pass_count INT NOT NULL DEFAULT 0, -- 审核通过数量
    is_reviewing BOOLEAN NOT NULL DEFAULT FALSE, -- 是否正在审核中
    is_review_pass BOOLEAN -- 是否审核通过
);

CREATE INDEX idxfk_post_group ON post(group_id,publish_time);
CREATE INDEX idx_post_get_list ON post(publish_time,id,is_delete,is_hide); -- 查询帖子列表
CREATE INDEX idx_post_user_insert_limit ON post(user_id,create_time); -- 查询某个用户每天已发布的作品数量

CREATE TABLE post_review(
    post_update_time TIMESTAMPTZ NOT NULL, -- 更新次数
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    commit_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_pass BOOLEAN NOT NULL DEFAULT FALSE, -- 是否通过
    reason VARCHAR(100), -- 不通过的理由
    PRIMARY KEY (post_id,post_update_time,user_id)
);

CREATE INDEX idxfk_post_review_post_id ON post_review(post_id,post_update_time,commit_time);
CREATE INDEX idxfk_post_review_user_id ON post_review(user_id);

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
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id)ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight SMALLINT NOT NULL, -- 点赞权重，举报为负数。如果过大于0则为点赞，过小于0则为举报。举报权重100为1人举报，点赞权重100为1人点赞
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT chk_post_like_weight CHECK (weight !=0) -- 权重范围
);
CREATE INDEX idxfk_post_like_user_id ON post_like(user_id,weight,create_time); -- 查询某个用户喜欢列表和举报列表

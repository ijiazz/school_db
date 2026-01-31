 
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
    is_hide BOOLEAN NOT NULL DEFAULT FALSE, -- 仅自己可见
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    publish_time TIMESTAMPTZ, -- 作品发布时间。如果为空则未发布
    content_text VARCHAR(10000), -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息
    like_count INT NOT NULL DEFAULT 0, -- 点赞数量 
    dislike_count SMALLINT NOT NULL DEFAULT 0, -- 异常阈值。当值达到100时，会触发人工审核。举报会提高这个数值
    options BIT(8) NOT NULL DEFAULT 0::BIT(8), -- 0000_0000   高1~2位:  是否匿名，是否关闭评论

    -- 如果 reviewing_id 不为空，表示正在审核中或审核失败。审核通过后 reviewing_id 将移动到 review_id 字段
    review_id INT REFERENCES review(id) ON DELETE SET NULL, -- 审核记录 id
    reviewing_id INT REFERENCES review(id) ON DELETE SET NULL -- 审核中记录 id
);

CREATE INDEX idxfk_post_group ON post(group_id,publish_time);
CREATE INDEX idxfk_post_review_id ON post(review_id) WHERE review_id IS NOT NULL;
CREATE INDEX idx_post_public_list ON post(reviewing_id, is_delete, publish_time, id) WHERE is_delete=FALSE AND is_hide=FALSE; -- 查询公开帖子列表

CREATE INDEX idx_post_user_insert_limit ON post(user_id,create_time); -- 查询某个用户每天已发布的作品数量

CREATE TABLE post_asset(
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    index INT NOT NULL, -- 作品在列表中的索引
    level media_level, -- 媒体质量等级
    type media_type NOT NULL, -- 资源类型
    filename VARCHAR(200), -- 文件名

    PRIMARY KEY (post_id, index, level)
);
CREATE INDEX idxfk_post_asset_post_id ON post_asset(post_id,index);

CREATE TABLE post_like(
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id)ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight SMALLINT NOT NULL, -- 点赞权重，举报为负数。如果过大于0则为点赞，过小于0则为举报。这个值可以用于以后推荐
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT chk_post_like_weight CHECK (weight !=0) -- 权重范围
);
CREATE INDEX idxfk_post_like_user_id ON post_like(user_id,weight,create_time); -- 查询某个用户喜欢列表和举报列表

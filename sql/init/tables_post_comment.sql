CREATE TABLE post_comment(
    id SERIAL PRIMARY KEY,
    root_comment_id INT REFERENCES post_comment(id) ON DELETE CASCADE,
    parent_comment_id INT REFERENCES post_comment(id) ON DELETE CASCADE,
    is_root_reply_count INT NOT NULL DEFAULT 0, -- 根评论的回复数
    reply_count INT NOT NULL DEFAULT 0, -- 回复数量

    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    like_count INT NOT NULL DEFAULT 0, -- 点赞数量
    dislike_count SMALLINT NOT NULL DEFAULT 0, -- 异常阈值。当值达到100时，会触发人工审核。举报会提高这个数值
    content_text VARCHAR(5000), -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息

    CONSTRAINT chk_root_parent_null
    CHECK ( (root_comment_id IS NULL AND parent_comment_id IS NULL)
      OR  (root_comment_id IS NOT NULL AND parent_comment_id IS NOT NULL)
    )
);


CREATE INDEX idxfk_post_comment_post_id ON post_comment(post_id,root_comment_id,parent_comment_id,create_time);
CREATE INDEX idxfk_post_comment_user_id ON post_comment(user_id,is_delete);
CREATE INDEX idxfk_post_comment_parent_comment_id ON post_comment(parent_comment_id,create_time,is_delete);
CREATE INDEX idxfk_post_comment_root_comment_id ON post_comment(root_comment_id,parent_comment_id,create_time,is_delete);

CREATE INDEX idx_comment_user_insert_limit ON post_comment(user_id,create_time);


CREATE TYPE post_review_type AS ENUM('post','post_comment');
CREATE TABLE post_review_info(
    type post_review_type NOT NULL, -- 审核类型
    target_id INT NOT NULL, -- 目标id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    reviewed_time TIMESTAMPTZ, -- 审核时间
    reviewer_id INT REFERENCES public.user(id) ON DELETE SET NULL ON UPDATE CASCADE, -- 审核人id
    is_review_pass BOOLEAN, -- 是否审核通过
    remark VARCHAR(100), -- 备注 
    PRIMARY KEY (type, target_id)
);


CREATE TABLE post_comment_like(
    comment_id INT NOT NULL REFERENCES post_comment(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight SMALLINT NOT NULL, -- 点赞权重，举报为负数。如果过大于0则为点赞，过小于0则为举报。这个值可以用于以后推荐
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX idxfk_post_comment_like_user_id ON post_comment_like(user_id);

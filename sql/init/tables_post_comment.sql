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
    dislike_count INT NOT NULL DEFAULT 0, -- 举报数量
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

CREATE TABLE post_comment_review_result(
    comment_id INT NOT NULL PRIMARY KEY REFERENCES post_comment(id) ON DELETE CASCADE,
    commit_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    review_fail_count INT NOT NULL DEFAULT 0, -- 审核通过数量，需要除以100，如果1人审核通过，则为100
    review_pass_count INT NOT NULL DEFAULT 0, -- 审核通过数量
    is_review_pass BOOLEAN -- 是否审核通过
);
CREATE INDEX idxfk_post_comment_review_result_get_list ON post_comment_review_result(commit_time,comment_id,is_review_pass); -- 获取评论需要审核的列表

CREATE TABLE post_comment_review(
    comment_id INT NOT NULL REFERENCES post_comment(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    commit_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_pass BOOLEAN NOT NULL DEFAULT FALSE, -- 是否通过
    reason VARCHAR(100), -- 不通过的理由
    PRIMARY KEY (comment_id,user_id)
);


CREATE TABLE post_comment_like(
    comment_id INT NOT NULL REFERENCES post_comment(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight SMALLINT NOT NULL, -- 点赞权重，举报为负数。如果过大于0则为点赞，过小于0则为举报。举报权重100为1人举报，点赞权重100为1人点赞
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX idxfk_post_comment_like_user_id ON post_comment_like(user_id);

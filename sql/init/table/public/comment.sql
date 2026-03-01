CREATE TYPE comment_group_type AS ENUM (
    'question', -- 帖子评论
    'competition' -- 竞赛评论
);

CREATE TABLE comment_tree(
    id SERIAL PRIMARY KEY,
    comment_total INT NOT NULL DEFAULT 0, -- 评论数量
    group_type comment_group_type -- 评论类型
);
CREATE INDEX idx_comment_tree_group ON comment_tree(group_type);

CREATE TABLE comment(
    id SERIAL PRIMARY KEY,
    root_comment_id INT REFERENCES comment(id) ON DELETE CASCADE,
    parent_comment_id INT REFERENCES comment(id) ON DELETE CASCADE,
    is_root_reply_count INT NOT NULL DEFAULT 0, -- 根评论的回复数
    reply_count INT NOT NULL DEFAULT 0, -- 回复数量

    comment_tree_id INT NOT NULL REFERENCES comment_tree(id) ON DELETE CASCADE,
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


CREATE INDEX idxfk_comment_comment_tree_id ON comment(comment_tree_id,root_comment_id,parent_comment_id,create_time);
CREATE INDEX idxfk_comment_user_id ON comment(user_id,is_delete);
CREATE INDEX idxfk_comment_parent_comment_id ON comment(parent_comment_id,create_time,is_delete);
CREATE INDEX idxfk_comment_root_comment_id ON comment(root_comment_id,parent_comment_id,create_time,is_delete);

CREATE INDEX idx_comment_user_insert_limit ON comment(user_id,create_time);


CREATE TABLE comment_like(
    comment_id INT NOT NULL REFERENCES comment(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight SMALLINT NOT NULL, -- 点赞权重，举报为负数。如果过大于0则为点赞，过小于0则为举报。这个值可以用于以后推荐
    reason VARCHAR(100), -- 举报需要一个理由
    PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX idxfk_comment_like_user_id ON comment_like(user_id);

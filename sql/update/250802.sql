DROP CONSTRAINT email_domain_lowercase ON public.user;
ALTER TABLE public.user
    ADD CONSTRAINT email_domain_lowercase CHECK (email ~ '^[^A-Z]+$'); -- 确保邮箱不区分大小写


ALTER TABLE post DROP COLUMN review_fail_count;
ALTER TABLE post DROP COLUMN review_pass_count;

ALTER TABLE post ALTER COLUMN dislike_count TYPE SMALLINT;
ALTER TABLE post_comment ALTER COLUMN dislike_count TYPE SMALLINT;

DROP TABLE post_review;

DROP TABLE post_comment_review;
DROP TABLE post_comment_review_result;


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
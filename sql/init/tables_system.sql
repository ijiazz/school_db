CREATE SCHEMA IF NOT EXISTS sys;

CREATE TABLE sys.log(
    name VARCHAR NOT NULL,
    info JSONB NOT NULL,
    level VARCHAR NOT NULL,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sys_log_level_name_create_time ON sys.log(level, name, create_time);
CREATE INDEX idx_sys_log_level ON sys.log(create_time);

CREATE TABLE sys.review_log(
    id SERIAL PRIMARY KEY,
    reviewer_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE, -- 审核者 id
    operation_time TIMESTAMPTZ NOT NULL DEFAULT now(),  
    review_result BOOLEAN, -- 审核结果 true 为审核通过，false 为审核不通过
    target VARCHAR NOT NULL, -- 审核对象
    target_id VARCHAR NOT NULL -- 审核对象的 id
);
CREATE INDEX idx_review_log_target ON review_log(target,target_id,operation_time);
CREATE INDEX idx_review_log_reviewer_id ON review_log(reviewer_id,operation_time);
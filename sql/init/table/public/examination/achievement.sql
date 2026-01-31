
CREATE TYPE achievement_type AS ENUM('exam_certificate');

CREATE TABLE achievement(
    id SERIAL PRIMARY KEY,
    meta_data JSONB NOT NULL, -- 成就元数据
    name VARCHAR(50) NOT NULL, -- 成就名称
    type achievement_type NOT NULL -- 成就类型
);

CREATE TABLE achievement_user_bind(
    achievement_id INT NOT NULL REFERENCES achievement(id) ON DELETE CASCADE, -- 成就 id
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 用户 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 获得成就时间
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_achievement_user_bind_user_list ON achievement_user_bind(user_id, create_time); -- 用户成就列表查询
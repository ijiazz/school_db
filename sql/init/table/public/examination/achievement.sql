
CREATE TYPE achievement_type AS ENUM('exam_certificate');

CREATE TABLE achievement(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 成就名称
    type achievement_type NOT NULL, -- 成就类型
    method_desc VARCHAR -- 获得方式

);
CREATE TABLE achievement_cert(
    id SERIAL PRIMARY KEY,
    achievement_id INT NOT NULL REFERENCES achievement(id) ON DELETE CASCADE -- 成就 id
); -- 证书成就表
CREATE INDEX idxfk_achievement_cert_achievement_id ON achievement_cert(achievement_id);

CREATE TABLE achievement_user_bind(
    cert_id INT NOT NULL REFERENCES achievement_cert(id) ON DELETE CASCADE, -- 成就证书 id
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 用户 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 获得成就时间
    PRIMARY KEY (cert_id, user_id)
);

CREATE INDEX idx_achievement_user_bind_user_list ON achievement_user_bind(user_id, create_time); -- 用户成就列表查询
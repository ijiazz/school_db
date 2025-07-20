CREATE TABLE public.user(
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50),
    avatar VARCHAR REFERENCES user_avatar(id) ON UPDATE CASCADE,
    
    email VARCHAR(256) NOT NULL UNIQUE,
    password CHAR(128),
    pwd_salt CHAR(32),
    
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 账号创建时间
    last_login_time TIMESTAMPTZ NOT NULL DEFAULT now() -- 最后登录时间
); 
CREATE INDEX idx_user_email ON public.user(email);
CREATE INDEX idxfk_avatar ON public.user(avatar);

CREATE TABLE user_blacklist( -- 用户黑名单
    user_id INT PRIMARY KEY REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason VARCHAR(100) NOT NULL -- 进黑名单原因
);

SELECT setval(pg_get_serial_sequence('public.user', 'id')::regclass,10000);


CREATE TABLE user_profile(
    user_id INT PRIMARY KEY REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    live_notice BOOLEAN DEFAULT FALSE NOT NULL, -- 是否接收直播通知
    acquaintance_time  TIMESTAMPTZ, -- 纪念日
    comment_stat_enabled BOOLEAN DEFAULT FALSE NOT NULL, -- 是否开启评论统计

    post_count INT NOT NULL DEFAULT 0, -- 发帖数
    post_like_count INT NOT NULL DEFAULT 0, -- 用户点赞的总帖子数
    post_like_get_count INT NOT NULL DEFAULT 0, -- 用户帖子获得的总数量

    report_correct_count INT NOT NULL DEFAULT 0, -- 举报正确数 (客观类，容易判断正确性的，包括帖子、用户)
    report_error_count INT NOT NULL DEFAULT 0, -- 举报错误数 (客观类，容易判断正确性的，包括帖子、用户)
    report_subjective_correct_count INT NOT NULL DEFAULT 0, -- 举报正确数 (主观类，包括评论)
    report_subjective_error_count INT NOT NULL DEFAULT 0 -- 举报错误数 (主观类，包括评论)
);
CREATE INDEX idx_user_live_notice ON user_profile(live_notice);

CREATE TABLE class(
    id SERIAL PRIMARY KEY,
    parent_class_id INT REFERENCES class(id) ON DELETE CASCADE,
    class_name VARCHAR(50),
    description VARCHAR(500)
);
CREATE INDEX idxfk_parent_class_id ON class(parent_class_id,id);
CREATE INDEX idx_parent_class_id ON class(class_name);

INSERT INTO class (id, class_name, description) VALUES (-1, 'public','公共班级，可以自由选择');

CREATE TABLE role(
    id VARCHAR(30) PRIMARY KEY,
    role_name VARCHAR(50),
    description VARCHAR(500)
);

CREATE TABLE user_class_bind(
    user_id INT REFERENCES public.user(id) ON DELETE CASCADE,
    class_id INT REFERENCES class(id) ON DELETE CASCADE,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, class_id)
);
CREATE TABLE user_role_bind(
    user_id INT REFERENCES public.user(id) ON DELETE CASCADE,
    role_id  VARCHAR(30) REFERENCES role(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE user_platform_bind(
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
    platform platform_flag NOT NULL,
    pla_uid VARCHAR NOT NULL,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_sync_time TIMESTAMPTZ,
    is_primary BOOLEAN,
    PRIMARY KEY (platform, pla_uid),
    FOREIGN KEY (platform, pla_uid) REFERENCES pla_user (platform, pla_uid) ON UPDATE CASCADE
);
CREATE INDEX idxfk_user_platform_bind_user_id ON user_platform_bind(user_id, platform, pla_uid);

CREATE TABLE captcha_picture(
    id VARCHAR PRIMARY KEY,
    type VARCHAR,
    is_true BOOLEAN, -- 人工断言是否为真
    yes_count INT NOT NULL DEFAULT 0, -- 选择的次数
    no_count INT NOT NULL DEFAULT 0 -- 不选的次数
);
CREATE INDEX idx_is_true ON captcha_picture(is_true);


CREATE OR REPLACE FUNCTION resource_ref_sync_user() RETURNS TRIGGER AS $$
BEGIN
    CASE TG_TABLE_NAME
    
    WHEN 'user' THEN
        PERFORM res_update_operate(OLD.avatar, NEW.avatar,'user_avatar');
    ELSE
        RAISE '不支持的触发表 %', TG_TABLE_NAME;
    END CASE;
    
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;


CREATE TRIGGER sync_user_resource_ref_count -- 评论头像快照 和 评论图片引用
AFTER INSERT OR DELETE OR UPDATE
ON public.user FOR EACH ROW EXECUTE FUNCTION resource_ref_sync_user ();
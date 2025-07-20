
ALTER TABLE user_profile DROP CONSTRAINT user_profile_user_id_fkey;
ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE user_profile
    ADD COLUMN post_count INT NOT NULL DEFAULT 0,
    ADD COLUMN post_like_count INT NOT NULL DEFAULT 0,
    ADD COLUMN post_like_get_count INT NOT NULL DEFAULT 0,

    ADD COLUMN report_correct_count INT NOT NULL DEFAULT 0,
    ADD COLUMN report_error_count INT NOT NULL DEFAULT 0,
    ADD COLUMN report_subjective_correct_count INT NOT NULL DEFAULT 0,
    ADD COLUMN report_subjective_error_count INT NOT NULL DEFAULT 0;

CREATE INDEX idxfk_user_platform_bind_user_id ON user_platform_bind(user_id, platform, pla_uid);

-- 导入 init/tables_post.sql
-- 导入 init/tables_post_comment.sql
SET client_encoding = 'UTF8';

CREATE ROLE ijia_web LOGIN INHERIT;

GRANT SELECT ON user_avatar TO ijia_web;
GRANT SELECT ON pla_user TO ijia_web;
GRANT SELECT ON watching_pla_user TO ijia_web;

GRANT SELECT ON pla_asset TO ijia_web;
GRANT SELECT ON asset_image TO ijia_web;
GRANT SELECT ON asset_video TO ijia_web;
GRANT SELECT ON asset_audio TO ijia_web;

GRANT SELECT ON pla_comment TO ijia_web;
GRANT SELECT ON comment_image TO ijia_web;


-- 用户

GRANT SELECT,INSERT,UPDATE ON public.user TO ijia_web;
GRANT SELECT,INSERT,UPDATE ON user_profile TO ijia_web;
GRANT SELECT,UPDATE ON SEQUENCE user_id_seq TO ijia_web;

GRANT SELECT,INSERT,UPDATE ON captcha_picture TO ijia_web;

GRANT SELECT,INSERT,UPDATE ON class TO ijia_web;
GRANT SELECT,UPDATE ON SEQUENCE class_id_seq TO ijia_web;

GRANT SELECT,INSERT,UPDATE ON role TO ijia_web;

GRANT SELECT,INSERT,UPDATE,DELETE ON user_class_bind TO ijia_web;
GRANT SELECT,INSERT,UPDATE,DELETE ON user_role_bind TO ijia_web;
GRANT SELECT,INSERT,UPDATE,DELETE ON user_platform_bind TO ijia_web;

-- end
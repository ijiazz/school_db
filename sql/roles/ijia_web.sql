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
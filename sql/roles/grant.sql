SET client_encoding = 'UTF8';

GRANT SELECT,INSERT,UPDATE ON user_avatar TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON pla_user TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON watching_pla_user TO ijia_crawler;

GRANT SELECT,INSERT,UPDATE ON pla_asset TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON asset_image TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON asset_video TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON asset_audio TO ijia_crawler;

GRANT SELECT,INSERT,UPDATE ON pla_comment TO ijia_crawler;
GRANT SELECT,INSERT,UPDATE ON comment_image TO ijia_crawler;

GRANT SELECT,INSERT,UPDATE  ON crawl_task_queue TO ijia_crawler;

GRANT SELECT ON crawl_task_priority_queue TO ijia_crawler;

GRANT SELECT, UPDATE ON SEQUENCE public.crawl_task_queue_task_id_seq TO ijia_crawler;
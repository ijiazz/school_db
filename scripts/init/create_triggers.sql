SET client_encoding = 'UTF8';

CREATE TRIGGER array_fk_check -- 评论表数组外键约束检测
BEFORE INSERT OR UPDATE 
ON pla_comment FOR EACH ROW
EXECUTE FUNCTION resource_array_fk ();

CREATE TRIGGER array_fk_check -- 评论表数组外键约束检测
BEFORE INSERT OR UPDATE
ON pla_published FOR EACH ROW
EXECUTE FUNCTION resource_array_fk ();

CREATE TRIGGER watch_resource_ref_count -- 评论资源同步
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_comment FOR EACH ROW
EXECUTE FUNCTION resource_ref_sync ();

CREATE TRIGGER sync_pla_published_resource_ref_count -- 作品资源同步
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_published FOR EACH ROW
EXECUTE FUNCTION resource_ref_sync ();

CREATE TRIGGER sync_pla_user_resource_ref_count -- 用户资源同步
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_user FOR EACH ROW
EXECUTE FUNCTION resource_ref_sync ();

-- DROP TRIGGER sync_pla_published_resource_ref_count ON pla_published;
-- DROP TRIGGER sync_pla_user_resource_ref_count ON pla_user;
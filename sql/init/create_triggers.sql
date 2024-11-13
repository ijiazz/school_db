SET
    client_encoding = 'UTF8';

CREATE TRIGGER sync_pla_comment_resource_ref_count -- 评论头像快照 和 评论图片引用
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_comment FOR EACH ROW EXECUTE FUNCTION resource_ref_sync ();

CREATE TRIGGER sync_pla_published_resource_ref_count -- 作品头像快照
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_published FOR EACH ROW EXECUTE FUNCTION resource_ref_sync ();

CREATE TRIGGER sync_pla_user_resource_ref_count -- 用户头像引用
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_user FOR EACH ROW EXECUTE FUNCTION resource_ref_sync ();
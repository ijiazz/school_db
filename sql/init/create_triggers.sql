SET client_encoding = 'UTF8'; 

CREATE TRIGGER sync_pla_asset_resource_ref_count -- 作品头像快照
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_asset FOR EACH ROW EXECUTE FUNCTION resource_ref_sync ();

CREATE TRIGGER sync_pla_user_resource_ref_count -- 用户头像引用
AFTER INSERT
OR DELETE
OR
UPDATE ON pla_user FOR EACH ROW EXECUTE FUNCTION resource_ref_sync ();
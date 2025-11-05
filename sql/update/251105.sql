-- 从 pla_comment 表中删除 user_name_snapshot 和 user_avatar_snapshot 列
-- user_avatar_snapshot 列上的外键约束和索引将通过 CASCADE 自动删除



WITH ref_count AS (SELECT user_avatar_snapshot, count(user_avatar_snapshot) FROM pla_comment
WHERE user_avatar_snapshot IS NOT NULL
GROUP BY user_avatar_snapshot)
UPDATE user_avatar AS c SET ref_count =c.ref_count- rc.count
FROM ref_count rc
WHERE c.id = rc.user_avatar_snapshot;



ALTER TABLE pla_comment
DROP COLUMN user_name_snapshot,
DROP COLUMN user_avatar_snapshot;

-- 更新触发器函数以移除对 user_avatar_snapshot 的引用计数操作
CREATE OR REPLACE FUNCTION pla_comment_resource_ref_sync() RETURNS TRIGGER AS $$
BEGIN
    CASE TG_TABLE_NAME
    
    WHEN 'pla_comment' THEN
        PERFORM res_update_operate(OLD.additional_image, NEW.additional_image,'comment_image');
        PERFORM res_update_operate(OLD.additional_image_thumb, NEW.additional_image_thumb,'comment_image');
    ELSE
        RAISE '不支持的触发表 %', TG_TABLE_NAME;
    END CASE;
    RETURN NEW;
END; $$ LANGUAGE PLPGSQL;


SET client_encoding = 'UTF8';

/**
 * 用户可以删除自己的评论。
 * 帖子作者可以删除所有评论
 * 如果 arg_user_id 为 NULL ，则不判断权限，直接删除
 */
CREATE OR REPLACE FUNCTION comment_delete(arg_comment_id INT, arg_user_id INT)
RETURNS INT AS $$
DECLARE
	count INT;
BEGIN
	SELECT 
		CASE WHEN c.root_comment_id IS NULL 
			THEN comment_recursive_delete(arg_comment_id)
			ELSE comment_delete_mark(arg_comment_id)
			END
		INTO count
		FROM comment AS c
			INNER JOIN comment_tree AS ct ON c.comment_tree_id = ct.id
			WHERE c.id = arg_comment_id AND NOT c.is_delete 
				AND (arg_user_id IS NULL OR ct.owner_id = arg_user_id OR c.user_id = arg_user_id);
	RETURN COALESCE(count, 0);
END; $$ LANGUAGE PLPGSQL;


CREATE OR REPLACE FUNCTION comment_delete_mark(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	target_tree_id INT;
	target_parent_id INT;
	target_root_id INT;
BEGIN
	UPDATE comment AS c SET is_delete = TRUE WHERE c.id = arg_comment_id AND NOT c.is_delete
	RETURNING c.comment_tree_id, c.parent_comment_id, c.root_comment_id
	INTO target_tree_id, target_parent_id, target_root_id; -- 标记删除评论
	IF NOT FOUND THEN
		RETURN 0;
	END IF;

	UPDATE comment_tree SET comment_total = comment_total - 1 WHERE id = target_tree_id; -- 更新评论树的评论总数

	-- 更新父评论的回复数和根评论的回复总数
	IF target_parent_id IS NOT NULL THEN
		UPDATE comment SET reply_count = reply_count - 1 WHERE id = target_parent_id;
		UPDATE comment SET is_root_reply_count = is_root_reply_count - 1 WHERE id = target_root_id;
	END IF;
	
	RETURN 1;

END; $$ LANGUAGE PLPGSQL;

/** 
 * 删除 commentId 以及所有子评论，更新父级评论回复数和根评论回复总数。非软删除
 */
CREATE OR REPLACE FUNCTION comment_recursive_delete(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	target_tree_id INT;
	target_parent_id INT;
	target_root_id INT;
	delete_total INT;
BEGIN	
	-- 递归查询所有子评论，计算总数
	WITH RECURSIVE tree AS(
		SELECT id AS cid, is_delete FROM comment WHERE id = arg_comment_id
		UNION ALL
		SELECT c.id, c.is_delete FROM comment AS c
		INNER JOIN tree ON tree.cid = c.parent_comment_id
	)
	SELECT count(*) FILTER (WHERE NOT is_delete) AS count INTO delete_total FROM tree;

	DELETE FROM comment WHERE id = arg_comment_id -- 删除评论（外键约束会级联删除子评论）
		RETURNING comment_tree_id, parent_comment_id, root_comment_id
		INTO target_tree_id, target_parent_id, target_root_id;

	IF delete_total = 0 THEN
		RETURN 0;
	END IF;

	UPDATE comment_tree SET comment_total = comment_total - delete_total WHERE id = target_tree_id; -- 更新评论树的评论总数

	-- 更新父评论的回复数和根评论的回复总数
	IF target_parent_id IS NOT NULL THEN
		UPDATE comment SET reply_count = reply_count - 1 WHERE id = target_parent_id;
		UPDATE comment SET is_root_reply_count = is_root_reply_count - delete_total WHERE id = target_root_id;
	END IF;
	
	RETURN delete_total;

END; $$ LANGUAGE PLPGSQL;
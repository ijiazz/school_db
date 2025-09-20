SET client_encoding = 'UTF8';

/**
 * 用户可以删除自己的评论。
 * 帖子作者可以删除所有评论
 * 如果 user_id 为 NULL ，则不判断权限，直接删除
 */
CREATE OR REPLACE FUNCTION post_delete_comment(comment_id INT, arg_user_id INT)
RETURNS INT AS $$
DECLARE
	count INT;
BEGIN
  WITH deleted AS ( -- 标记删除
		UPDATE post_comment AS c SET is_delete=TRUE
		FROM post AS p
		WHERE c.id=comment_id
			AND NOT c.is_delete
			AND (arg_user_id IS NULL OR p.user_id=arg_user_id OR c.user_id=arg_user_id)
		RETURNING c.id, c.root_comment_id, c.parent_comment_id, c.post_id, c.is_root_reply_count
  ), update_post AS (-- 更新帖子评论数
		UPDATE post AS p
		SET comment_num = comment_num - (
			CASE WHEN deleted.root_comment_id IS NULL
				THEN deleted.is_root_reply_count + 1
				ELSE 1
			END
		)
		FROM deleted
		WHERE p.id = deleted.post_id
	), change_parent AS ( --计算需要更新的父评论的回复数变更
		SELECT
			coalesce(a.id, b.id) AS id,
			coalesce(a.parent_count, 0) AS reply_count,
			coalesce(b.root_count, 0) AS is_root_reply_count
		FROM (
			SELECT parent_comment_id AS id, count(*) AS parent_count 
			FROM deleted
			WHERE parent_comment_id IS NOT NULL
			GROUP BY parent_comment_id
		) AS a FULL OUTER JOIN (
			SELECT root_comment_id AS id, count(*) AS root_count 
			FROM deleted
			WHERE root_comment_id IS NOT NULL
			GROUP BY root_comment_id
		) AS b ON a.id = b.id
	), update_parent AS (   -- 更新父评论的回复数
    UPDATE post_comment AS c SET 
      reply_count = c.reply_count - change_parent.reply_count,
      is_root_reply_count = c.is_root_reply_count - change_parent.is_root_reply_count
    FROM change_parent
    WHERE c.id = change_parent.id
  )
	SELECT count(*) INTO count FROM deleted;
	RETURN count;

END; $$ LANGUAGE PLPGSQL;



/** 
 * 删除 commentId 以及所有子评论，更新父级评论回复数和跟评论回复总数
 */
CREATE OR REPLACE FUNCTION post_recursive_delete_comment(arg_comment_id INT, arg_user_id INT)
RETURNS TABLE(changed_parent JSON, can_delete_total INT, count INT) AS $$
BEGIN
	 RETURN QUERY WITH need_delete AS (
		SELECT
			base.id AS cid,
			base.parent_comment_id AS parent_cid,
			base.root_comment_id AS root_cid,
			base.user_id AS comment_user_id,
			p.id AS post_id,
			p.user_id AS post_user_id
		FROM post_comment AS base
		INNER JOIN post AS p ON p.id = base.post_id
		WHERE base.id = arg_comment_id
			AND NOT base.is_delete
			AND (arg_user_id IS NULL OR p.user_id=arg_user_id OR base.user_id=arg_user_id)
	), deleted AS (
		UPDATE post_comment SET
			is_delete= TRUE,
			is_root_reply_count= 0,
			reply_count= 0
		FROM (
			WITH RECURSIVE tree AS (
				SELECT cid AS cid FROM need_delete
				UNION ALL
				SELECT c.id FROM post_comment AS c
				INNER JOIN tree ON c.parent_comment_id=tree.cid AND NOT c.is_delete
			)
			SELECT * FROM tree
		) AS tree2
		  WHERE NOT is_delete AND post_comment.id= tree2.cid
		  RETURNING id, root_comment_id, parent_comment_id
	), delete_total AS (
		SELECT COUNT(*) FROM deleted
	), update_post AS (
		UPDATE post SET
			comment_num = comment_num - delete_total.count
		FROM delete_total, need_delete
		WHERE post.id = need_delete.post_id
	), change_parent AS ( --计算需要更新的父评论的回复数变更
	  SELECT COALESCE(a.id, b.id) AS id,
	    COALESCE(a.parent_count, 0) AS reply_count,
	    COALESCE(b.root_count, 0) AS is_root_reply_count
	  FROM (
	    SELECT parent_comment_id AS id, COUNT(*) AS parent_count
	    FROM deleted
	    WHERE parent_comment_id IS NOT NULL
	    GROUP BY parent_comment_id
	  ) AS a FULL OUTER JOIN (
	    SELECT root_comment_id AS id, COUNT(*) AS root_count
	    FROM deleted
	    WHERE root_comment_id IS NOT NULL
	    GROUP BY root_comment_id
	  ) AS b ON a.id = b.id
	), update_parent AS (
	  UPDATE post_comment AS c SET
	    reply_count = c.reply_count - change_parent.reply_count,
	    is_root_reply_count = c.is_root_reply_count - change_parent.is_root_reply_count
	  FROM change_parent WHERE c.id = change_parent.id
	)
	SELECT
	  (SELECT json_agg(change_parent) FROM change_parent) AS changed_parent,
	  (SELECT count(need_delete)::INT FROM need_delete) AS can_delete_total,
	  delete_total.count::INT AS deleted_total
	FROM delete_total;

END; $$ LANGUAGE PLPGSQL;
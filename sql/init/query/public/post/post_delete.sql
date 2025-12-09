
SET client_encoding = 'UTF8';

/* 
	删除一个帖子
	如果 userId 不为空，则只能删除自己的帖子
	如果删除成功，返回 1，否则返回 0
 */
CREATE OR REPLACE FUNCTION post_delete(post_id INT, userId INT)
RETURNS INT AS $$
DECLARE
	count INT;
BEGIN
	WITH updated AS (
		UPDATE post SET is_delete=TRUE
		WHERE id=post_id AND is_delete=FALSE AND (userId IS NULL OR user_id=userId)
		RETURNING id AS post_id, user_id, like_count
	), update_user_stat AS (
		UPDATE user_profile
		SET
			post_count = user_profile.post_count - 1,
			post_like_get_count = user_profile.post_like_get_count - updated.like_count
		FROM updated
		WHERE user_profile.user_id = updated.user_id
	)
	SELECT count(*) INTO count FROM updated;
	RETURN count;

END; $$ LANGUAGE PLPGSQL;
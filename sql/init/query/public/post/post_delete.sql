
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
	IF userId IS NULL THEN
		DELETE FROM post WHERE id=post_id AND NOT is_delete;
	ELSE
		DELETE FROM post WHERE id=post_id AND user_id=userId AND NOT is_delete;
	END IF;

	GET DIAGNOSTICS count = ROW_COUNT;
	RETURN count;	
END; $$ LANGUAGE PLPGSQL;
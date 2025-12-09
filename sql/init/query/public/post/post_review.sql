
SET client_encoding = 'UTF8';

/**
 * 审核帖子
 *
 * arg_post_id: 帖子ID
 * arg_is_pass: 是否通过审核
 * arg_reviewer_id: 审核人ID
 * arg_remark: 备注
 *
 * 返回值: 1表示成功，0表示没有找到待审核的记录
 */
CREATE OR REPLACE FUNCTION post_commit_review_post(arg_post_id INT, arg_is_pass BOOLEAN, arg_reviewer_id INT, arg_remark TEXT)
RETURNS INT AS $$
DECLARE
	count INT;
	review_target_id INT;
BEGIN
	-- 更新审核记录
	UPDATE post_review_info
		SET is_review_pass= arg_is_pass,
			remark=arg_remark,
			reviewed_time=NOW(),
			reviewer_id=arg_reviewer_id
		WHERE target_id= arg_post_id AND type='post'
			AND is_review_pass IS NULL
		RETURNING target_id INTO review_target_id;

	IF NOT FOUND THEN
		RETURN 0; 
	END IF;
		
	-- 更新帖子审核状态
	UPDATE post SET 
    is_reviewing = FALSE,
    is_review_pass = arg_is_pass,
    publish_time = COALESCE(publish_time, create_time)
	WHERE id = review_target_id;

	-- 更新举报者的正确率
  UPDATE user_profile AS u SET
    report_correct_count = u.report_correct_count + (CASE WHEN arg_is_pass THEN 1 ELSE 0 END),
    report_error_count = u.report_error_count + (CASE WHEN arg_is_pass THEN 0 ELSE 1 END)
  FROM ( 
		SELECT l.user_id AS user_id
		FROM post_like AS l
		WHERE l.post_id = review_target_id AND l.weight < 0
  ) AS ref 
  WHERE u.user_id = ref.user_id;

	RETURN 1;


END; $$ LANGUAGE PLPGSQL;


/**
 * 审核评论
 *
 * arg_comment_id: 帖子ID
 * arg_is_pass: 是否通过审核
 * arg_reviewer_id: 审核人ID
 * arg_remark: 备注
 *
 * 返回值: 1表示成功，0表示没有找到待审核的记录
 */
CREATE OR REPLACE FUNCTION post_commit_review_comment(arg_comment_id INT, arg_is_pass BOOLEAN, arg_reviewer_id INT, arg_remark TEXT)
RETURNS INT AS $$
DECLARE
	count INT;
	review_target_id INT;
BEGIN
	-- 更新审核记录
	UPDATE post_review_info
		SET is_review_pass= arg_is_pass,
			remark=arg_remark,
			reviewed_time=NOW(),
			reviewer_id=arg_reviewer_id
		WHERE target_id= arg_comment_id AND type='post_comment'
			AND is_review_pass IS NULL
		RETURNING target_id INTO review_target_id;

	IF NOT FOUND THEN
		RETURN 0; 
	END IF;
	
	IF NOT arg_is_pass THEN
		-- 删除评论
		PERFORM post_delete_comment(review_target_id, NULL); 
	END IF;  

	-- 更新举报者的正确率
  UPDATE user_profile AS u SET
    report_subjective_correct_count = u.report_subjective_correct_count + (CASE WHEN arg_is_pass THEN 1 ELSE 0 END),
    report_subjective_error_count = u.report_subjective_error_count + (CASE WHEN arg_is_pass THEN 0 ELSE 1 END)
  FROM ( 
		SELECT l.user_id AS user_id
		FROM post_comment_like AS l
		WHERE l.comment_id = review_target_id AND l.weight < 0
  ) AS ref 
  WHERE u.user_id = ref.user_id;

	RETURN 1;


END; $$ LANGUAGE PLPGSQL;

SET client_encoding = 'UTF8';

/* 直接将指定帖子设置为审核中 */
CREATE OR REPLACE FUNCTION review_post_set_to_reviewing(arg_post_id INTEGER)
RETURNS INT AS $$
DECLARE
	new_review_id INT;
    target_reviewing_id INT;
BEGIN
    SELECT reviewing_id INTO target_reviewing_id
        FROM post
        WHERE id = arg_post_id AND NOT is_delete;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'post id % not found or is deleted', arg_post_id;
    END IF;

    IF target_reviewing_id IS NOT NULL THEN
        DELETE FROM review WHERE id = target_reviewing_id;
    END IF;

    -- 插入审核项
    INSERT INTO review(target_type, info, review_display)
    VALUES (
            'post':: review_target_type,
            jsonb_build_object('target_id', arg_post_id),
            NULL
        )
    RETURNING id INTO new_review_id;

    UPDATE post 
        SET reviewing_id = new_review_id
        WHERE id = arg_post_id;


    RETURN new_review_id;
END; $$ LANGUAGE PLPGSQL;


/* 直接将指定帖子的评论设置为审核中 */
CREATE OR REPLACE FUNCTION review_post_comment_set_to_reviewing(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	new_review_id INT;
    target_reviewing_id INT;
BEGIN 
    SELECT reviewing_id INTO target_reviewing_id
        FROM post_comment
        WHERE id = arg_comment_id AND NOT is_delete AND reviewing_id IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'post comment id % not found or is deleted or already reviewed', arg_comment_id;
    END IF;

    -- 插入审核项
    INSERT INTO review(target_type, info, review_display)
    VALUES (
            'post_comment':: review_target_type,
            jsonb_build_object('target_id', arg_comment_id),
            NULL
        )
    RETURNING id INTO new_review_id;

    UPDATE post_comment 
        SET reviewing_id = new_review_id
        WHERE id = arg_comment_id;

    RETURN new_review_id;
END; $$ LANGUAGE PLPGSQL;


/**
 * 审核帖子
 *
 * arg_review_id: 审核记录ID
 * arg_is_pass: 是否通过审核
 * arg_reviewer_id: 审核人ID
 * arg_remark: 备注
 *
 * 返回值: 1表示成功，0表示没有找到待审核的记录
 */
CREATE OR REPLACE FUNCTION review_post_commit(arg_review_id INT, arg_is_pass BOOLEAN, arg_reviewer_id INT, arg_remark TEXT)
RETURNS INT AS $$
DECLARE
	review_target_id INT;
	old_review_id INT;
BEGIN
	-- 更新审核记录
	UPDATE review
		SET is_passed= arg_is_pass,
			resolved_time=NOW(),
			reviewer_id=arg_reviewer_id,
			comment=arg_remark,
			pass_count = CASE WHEN arg_is_pass THEN pass_count + 1 ELSE pass_count END,
			reject_count = CASE WHEN NOT arg_is_pass THEN reject_count + 1 ELSE reject_count END
		WHERE id= arg_review_id AND target_type='post'
			AND is_passed IS NULL
		RETURNING (info->>'target_id')::INT INTO review_target_id;

	IF NOT FOUND THEN
		RETURN 0; 
	END IF;

	IF review_target_id IS NULL THEN
		RAISE EXCEPTION 'review id % missing target_id info', arg_review_id;
	END IF;

	IF arg_is_pass THEN
        SELECT review_id INTO old_review_id
        FROM post
        WHERE id = review_target_id;

		-- 更新帖子审核状态
		UPDATE post 
			SET review_id = reviewing_id,
		  	    reviewing_id = NULL,
		  	    publish_time = COALESCE(publish_time, create_time)
			WHERE id = review_target_id;

		IF old_review_id IS NOT NULL THEN
			DELETE FROM review WHERE id = old_review_id; -- 删除旧的审核记录
		END IF;

	END IF;


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
 * arg_review_id: 审核记录ID
 * arg_is_pass: 是否通过审核
 * arg_reviewer_id: 审核人ID
 * arg_remark: 备注
 *
 * 返回值: 1表示成功，0表示没有找到待审核的记录
 */
CREATE OR REPLACE FUNCTION review_post_comment_commit(arg_review_id INT, arg_is_pass BOOLEAN, arg_reviewer_id INT, arg_remark TEXT)
RETURNS INT AS $$
DECLARE
	review_target_id INT;
BEGIN

	-- 更新审核记录
	UPDATE review
		SET is_passed= arg_is_pass,
			resolved_time=NOW(),
			reviewer_id=arg_reviewer_id,
			comment=arg_remark,
			pass_count = CASE WHEN arg_is_pass THEN pass_count + 1 ELSE pass_count END,
			reject_count = CASE WHEN NOT arg_is_pass THEN reject_count + 1 ELSE reject_count END
		WHERE id= arg_review_id AND target_type='post_comment'
			AND is_passed IS NULL
		RETURNING (info->>'target_id')::INT INTO review_target_id;

	IF NOT FOUND THEN
		RETURN 0; 
	END IF;
	
	IF review_target_id IS NULL THEN
		RAISE EXCEPTION 'review id % missing target_id info', arg_review_id;
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

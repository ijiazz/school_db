SET client_encoding = 'UTF8';

/* 直接将指定考试问题设置为审核中 */
CREATE OR REPLACE FUNCTION review_question_set_to_reviewing(arg_question_id INTEGER)
RETURNS INT AS $$
DECLARE
	new_review_id INT;
BEGIN
    SELECT review_id INTO new_review_id
        FROM exam_question
        WHERE id = arg_question_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'question id % not found', arg_question_id;
    END IF;

    IF new_review_id IS NOT NULL THEN
			DELETE FROM review WHERE id = new_review_id;
    END IF;

		-- 插入审核项
    INSERT INTO review(target_type, info, review_display)
    VALUES (
            'question':: review_target_type,
            jsonb_build_object('target_id', arg_question_id),
            NULL
        )
    RETURNING id INTO new_review_id;

    UPDATE exam_question
        SET review_id = new_review_id,
					review_status = 'pending'::review_status
        WHERE id = arg_question_id;

    RETURN new_review_id;
END; $$ LANGUAGE PLPGSQL;
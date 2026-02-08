 

-- 审核状态是否处于审核中或审核拒绝
CREATE OR REPLACE FUNCTION review_status_is_progress(review_status review_status)
RETURNS BOOLEAN AS $$
BEGIN
    IF review_status IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN review_status = 'pending' OR review_status = 'rejected';
END; $$ LANGUAGE PLPGSQL;

-- 提交审核记录，返回更新后的通过或拒绝数量
CREATE OR REPLACE FUNCTION review_commit(review_id INT, reviewer_id INT, arg_is_passed BOOLEAN, comment VARCHAR)
RETURNS INT AS $$
DECLARE
    after_count INT;
BEGIN
    INSERT INTO review_record(review_id, reviewer_id, is_passed, comment)
    VALUES (review_id, reviewer_id, arg_is_passed, comment);

    IF arg_is_passed THEN
        UPDATE review
            SET pass_count = pass_count + 1
            WHERE id = review_id
            RETURNING pass_count INTO after_count;
    ELSE
        UPDATE review
            SET reject_count = reject_count + 1
            WHERE id = review_id
            RETURNING reject_count INTO after_count;
    END IF;

    RETURN after_count;
END; $$ LANGUAGE PLPGSQL;


-- 最终审批
CREATE OR REPLACE FUNCTION review_approve(arg_target_type review_target_type, arg_review_id INT, arg_is_passed BOOLEAN, arg_reviewer_id INT, arg_remark TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE review
	SET is_passed= arg_is_passed,
		resolved_time=NOW(),
		reviewer_id=arg_reviewer_id,
		comment=arg_remark,
		pass_count = CASE WHEN arg_is_passed THEN pass_count + 1 ELSE pass_count END,
		reject_count = CASE WHEN NOT arg_is_passed THEN reject_count + 1 ELSE reject_count END
	WHERE id= arg_review_id AND target_type=arg_target_type
		AND is_passed IS NULL
	RETURNING info INTO result;
    RETURN result;
END; $$ LANGUAGE PLPGSQL;
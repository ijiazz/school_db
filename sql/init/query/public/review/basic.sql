 
-- 提交审核记录，返回更新后的通过或拒绝数量
CREATE FUNCTION review_commit(review_id INT, reviewer_id INT, arg_is_passed BOOLEAN, comment VARCHAR)
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
END;
$$ LANGUAGE PLPGSQL;

 
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

-- 插入审核记录，如果已有则删除旧的再插入，返回新的审核记录ID
CREATE FUNCTION review_insert_record_check_old(existed_id INT, arg_target_type review_target_type, arg_info JSONB, arg_review_display JSONB)
RETURNS INT AS $$
DECLARE
BEGIN
    IF existed_id IS NOT NULL THEN

        DELETE FROM review AS r 
        WHERE id = existed_id AND r.target_type = arg_target_type;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'review id % not found for target_type %', existed_id, arg_target_type;
        END IF;
    END IF;
    INSERT INTO review(target_type, info, review_display)
    VALUES (arg_target_type, arg_info, arg_review_display)
    RETURNING id INTO existed_id;
    
    RETURN existed_id;

END; $$ LANGUAGE PLPGSQL;
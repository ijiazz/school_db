SET client_encoding = 'UTF8';
/* 直接将指定帖子设置为审核中 */
CREATE OR REPLACE FUNCTION post_set_to_reviewing(post_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    result_id INTEGER;
BEGIN
    WITH need_add_review AS(
        UPDATE post 
            SET is_reviewing = TRUE 
        WHERE id = post_id AND NOT is_delete AND NOT is_reviewing
        RETURNING id AS post_id
    )
    INSERT INTO post_review_info (type, target_id)
        SELECT 'post', post_id FROM need_add_review
        ON CONFLICT (type, target_id) DO
        UPDATE SET is_review_pass = NULL, review_time = NULL
        RETURNING target_id INTO result_id;

    RETURN result_id;
END; $$ LANGUAGE PLPGSQL;


/* 直接将指定帖子的评论设置为审核中 */
CREATE OR REPLACE FUNCTION post_set_comment_to_reviewing(comment_id INT)
RETURNS INTEGER AS $$
DECLARE
    result_id INTEGER;
BEGIN
    INSERT INTO post_review_info (type, target_id)
        SELECT 'post_comment', id FROM post_comment
            WHERE id = comment_id
    ON CONFLICT (type, target_id) DO NOTHING
    RETURNING target_id INTO result_id;

    RETURN result_id;
END; $$ LANGUAGE PLPGSQL;

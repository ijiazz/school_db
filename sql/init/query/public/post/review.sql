SET client_encoding = 'UTF8';
/* 直接将指定帖子设置为审核中 */
CREATE OR REPLACE FUNCTION post_set_to_reviewing(post_id INTEGER)
RETURNS VOID AS $$
DECLARE
    result_id INTEGER;
BEGIN
    UPDATE post 
        SET reviewing_id = review_insert_record_check_old(
                reviewing_id,
                'post',
                jsonb_build_object('post_id', arg_post_id),
                jsonb_build_array('post_id', arg_post_id)
            )
    WHERE id = arg_post_id AND NOT is_delete;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'post id % not found or is deleted', arg_post_id;
    END IF;
    RETURN;
END; $$ LANGUAGE PLPGSQL;


/* 直接将指定帖子的评论设置为审核中 */
CREATE OR REPLACE FUNCTION post_set_comment_to_reviewing(arg_comment_id INT)
RETURNS INTEGER AS $$
DECLARE
    result_id INTEGER;
BEGIN
    UPDATE post_comment 
        SET reviewing_id = review_insert_record_check_old(
                reviewing_id,
                'post_comment',
                jsonb_build_object('comment_id', arg_comment_id),
                jsonb_build_array('comment_id', arg_comment_id)
            )
    WHERE id = arg_comment_id AND NOT is_delete;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'post comment id % not found or is deleted', arg_comment_id;
    END IF;
    RETURN;
END; $$ LANGUAGE PLPGSQL;

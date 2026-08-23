-- review 表
UPDATE review SET target_type = 'comment' WHERE target_type = 'post_comment';
-- end

--------------
-- comment 迁移
ALTER TYPE comment_group_type ADD VALUE 'post';
ALTER TABLE comment ADD COLUMN review_status review_status;
ALTER TABLE comment ADD COLUMN review_id INT REFERENCES review(id) ON DELETE SET NULL;

CREATE TEMPORARY TABLE _tree_map AS
SELECT
	p.id AS post_id,
	p.user_id AS owner_id,
  comment_num,
	nextval(pg_get_serial_sequence('comment_tree', 'id'))::INT AS comment_tree_id
FROM post AS p
WHERE NOT p.is_delete;


-- comment_tree 生成
ALTER TABLE comment_tree ADD COLUMN owner_id INT REFERENCES "user"(id) ON DELETE SET NULL;
INSERT INTO comment_tree(id,comment_total,owner_id,group_type) SELECT comment_tree_id,comment_num,owner_id,'post' FROM _tree_map;
-- end

-- post 表字段更改
ALTER TABLE post ADD COLUMN comment_tree_id INT REFERENCES comment_tree(id) ON DELETE SET NULL;
UPDATE post SET comment_tree_id = map.comment_tree_id FROM _tree_map AS map WHERE post.id = map.post_id;
ALTER TABLE post DROP COLUMN comment_num;
-- end


ALTER TABLE comment DISABLE TRIGGER ALL; -- 关闭 comment 表的外键约束

INSERT INTO comment(
  id, root_comment_id, parent_comment_id,
  is_root_reply_count, reply_count,
  comment_tree_id, user_id,
  create_time,
  is_delete, like_count, dislike_count,
  content_text, content_text_struct,
  review_status, review_id
) SELECT 
  id, root_comment_id, parent_comment_id,
  is_root_reply_count, reply_count,
  map.comment_tree_id, user_id,
  create_time,
  is_delete, like_count, dislike_count,
  content_text, content_text_struct,
  review_status, review_id
FROM post_comment AS c
INNER JOIN _tree_map AS map ON c.post_id = map.post_id;

ALTER TABLE comment ENABLE TRIGGER ALL; -- 开启 comment 表的外键约束

-- 将序列 comment_id_seq 设置为和 post_comment_id_seq 一样的值
SELECT setval('comment_id_seq', (SELECT last_value FROM post_comment_id_seq));

INSERT INTO comment_like(comment_id, user_id, create_time, weight, reason)
SELECT comment_id, user_id, create_time, weight, reason
FROM post_comment_like;

DROP TABLE post_comment_like;
DROP TABLE post_comment;

--------------

DROP TABLE _tree_map;
CREATE TEMPORARY TABLE _tree_map AS
SELECT
	q.id,
	nextval(pg_get_serial_sequence('comment_tree', 'id'))::INT AS comment_tree_id
FROM exam_question AS q WHERE q.comment_id IS NULL;

INSERT INTO comment_tree(id,group_type) SELECT comment_tree_id,'question' FROM _tree_map;
UPDATE exam_question SET comment_id = map.comment_tree_id FROM _tree_map AS map WHERE exam_question.id = map.id;




-- 函数


DROP FUNCTION review_post_comment_set_to_reviewing(arg_comment_id INT);
DROP FUNCTION review_post_comment_commit(arg_review_id INT, arg_is_pass BOOLEAN, arg_reviewer_id INT, arg_remark TEXT);


CREATE OR REPLACE FUNCTION post_delete(post_id INT, userId INT)
RETURNS INT AS $$
DECLARE
	count INT;
BEGIN
	IF userId IS NULL THEN
		UPDATE post SET is_delete=TRUE WHERE id=post_id AND NOT is_delete;
	ELSE
		UPDATE post SET is_delete=TRUE WHERE id=post_id AND user_id=userId AND NOT is_delete;
	END IF;

	GET DIAGNOSTICS count = ROW_COUNT;
	RETURN count;	
END; $$ LANGUAGE PLPGSQL;


DROP FUNCTION post_recursive_delete_comment(arg_comment_id INT, arg_user_id INT);
DROP FUNCTION post_delete_comment(comment_id INT, arg_user_id INT);


/* 直接将指定评论设置为审核中 */
CREATE OR REPLACE FUNCTION review_comment_set_to_reviewing(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	new_review_id INT;
BEGIN 
    SELECT review_id INTO new_review_id
        FROM comment
        WHERE id = arg_comment_id AND NOT is_delete;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'comment id % not found or is deleted or already reviewed', arg_comment_id;
    END IF;

   IF new_review_id IS NOT NULL THEN
			DELETE FROM review WHERE id = new_review_id;
    END IF;


    -- 插入审核项
    INSERT INTO review(target_type, info, review_display)
    VALUES (
            'comment':: review_target_type,
            jsonb_build_object('target_id', arg_comment_id),
            NULL
        )
    RETURNING id INTO new_review_id;

    UPDATE comment 
        SET review_id = new_review_id,
					review_status = 'pending'::review_status
        WHERE id = arg_comment_id;

    RETURN new_review_id;
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
CREATE OR REPLACE FUNCTION review_comment_commit(arg_review_id INT, arg_is_pass BOOLEAN, arg_reviewer_id INT, arg_remark TEXT)
RETURNS INT AS $$
DECLARE
	info JSONB;
	review_target_id INT;
BEGIN
  info := review_approve('comment', arg_review_id, arg_is_pass, arg_reviewer_id, arg_remark);
	
	IF info IS NULL THEN
		RETURN 0;
	END IF;

	review_target_id := (info->>'target_id')::INT;
	IF review_target_id IS NULL THEN
		RAISE EXCEPTION 'review id % missing target_id info', arg_review_id;
	END IF;
	
	-- 更新举报者的正确率
  UPDATE user_profile AS u SET
    report_subjective_correct_count = u.report_subjective_correct_count + (CASE WHEN arg_is_pass THEN 1 ELSE 0 END),
    report_subjective_error_count = u.report_subjective_error_count + (CASE WHEN arg_is_pass THEN 0 ELSE 1 END)
  FROM ( 
		SELECT l.user_id AS user_id
		FROM comment_like AS l
		WHERE l.comment_id = review_target_id AND l.weight < 0
  ) AS ref 
  WHERE u.user_id = ref.user_id;

  IF arg_is_pass THEN
    UPDATE comment
      SET review_status= 'passed'::review_status
      WHERE id = review_target_id;
  ELSE
		-- 删除评论
		PERFORM comment_delete(review_target_id, NULL);
	END IF;

	RETURN 1;
END; $$ LANGUAGE PLPGSQL;

/**
 * 用户可以删除自己的评论。
 * 帖子作者可以删除所有评论
 * 如果 arg_user_id 为 NULL ，则不判断权限，直接删除
 */
CREATE OR REPLACE FUNCTION comment_delete(arg_comment_id INT, arg_user_id INT)
RETURNS INT AS $$
DECLARE
	count INT;
BEGIN
	SELECT 
		CASE WHEN c.root_comment_id IS NULL 
			THEN comment_recursive_delete(arg_comment_id)
			ELSE comment_delete_mark(arg_comment_id)
			END
		INTO count
		FROM comment AS c
			INNER JOIN comment_tree AS ct ON c.comment_tree_id = ct.id
			WHERE c.id = arg_comment_id AND NOT c.is_delete 
				AND (arg_user_id IS NULL OR ct.owner_id = arg_user_id OR c.user_id = arg_user_id);
	RETURN COALESCE(count, 0);
END; $$ LANGUAGE PLPGSQL;


CREATE OR REPLACE FUNCTION comment_delete_mark(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	target_tree_id INT;
	target_parent_id INT;
	target_root_id INT;
BEGIN
	UPDATE comment AS c SET is_delete = TRUE WHERE c.id = arg_comment_id AND NOT c.is_delete
	RETURNING c.comment_tree_id, c.parent_comment_id, c.root_comment_id
	INTO target_tree_id, target_parent_id, target_root_id; -- 标记删除评论
	IF NOT FOUND THEN
		RETURN 0;
	END IF;

	UPDATE comment_tree SET comment_total = comment_total - 1 WHERE id = target_tree_id; -- 更新评论树的评论总数

	-- 更新父评论的回复数和根评论的回复总数
	IF target_parent_id IS NOT NULL THEN
		UPDATE comment SET reply_count = reply_count - 1 WHERE id = target_parent_id;
		UPDATE comment SET is_root_reply_count = is_root_reply_count - 1 WHERE id = target_root_id;
	END IF;
	
	RETURN 1;

END; $$ LANGUAGE PLPGSQL;

/** 
 * 删除 commentId 以及所有子评论，更新父级评论回复数和根评论回复总数。非软删除
 */
CREATE OR REPLACE FUNCTION comment_recursive_delete(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	target_tree_id INT;
	target_parent_id INT;
	target_root_id INT;
	delete_total INT;
BEGIN	
	-- 递归查询所有子评论，计算总数
	WITH RECURSIVE tree AS(
		SELECT id AS cid, is_delete FROM comment WHERE id = arg_comment_id
		UNION ALL
		SELECT c.id, c.is_delete FROM comment AS c
		INNER JOIN tree ON tree.cid = c.parent_comment_id
	)
	SELECT count(*) FILTER (WHERE NOT is_delete) AS count INTO delete_total FROM tree;

	IF delete_total = 0 THEN
		RETURN 0;
	END IF;

	DELETE FROM comment WHERE id = arg_comment_id -- 删除评论（外键约束会级联删除子评论）
		RETURNING comment_tree_id, parent_comment_id, root_comment_id
		INTO target_tree_id, target_parent_id, target_root_id;

	UPDATE comment_tree SET comment_total = comment_total - delete_total WHERE id = target_tree_id; -- 更新评论树的评论总数

	-- 更新父评论的回复数和根评论的回复总数
	IF target_parent_id IS NOT NULL THEN
		UPDATE comment SET reply_count = reply_count - 1 WHERE id = target_parent_id;
		UPDATE comment SET is_root_reply_count = is_root_reply_count - delete_total WHERE id = target_root_id;
	END IF;
	
	RETURN delete_total;

END; $$ LANGUAGE PLPGSQL;


CREATE OR REPLACE FUNCTION post_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    CASE TG_OP
        WHEN 'DELETE' THEN
            IF NOT OLD.is_delete THEN
                UPDATE user_profile
                SET
                    post_count = user_profile.post_count - 1,
                    post_like_get_count = user_profile.post_like_get_count - OLD.like_count
                WHERE user_profile.user_id = OLD.user_id;
            END IF;
            DELETE FROM comment_tree WHERE id = OLD.comment_tree_id;
        WHEN 'UPDATE' THEN
            IF OLD.is_delete IS DISTINCT FROM NEW.is_delete THEN
                IF NEW.is_delete THEN
                    UPDATE user_profile
                    SET
                        post_count = user_profile.post_count - 1,
                        post_like_get_count = user_profile.post_like_get_count - OLD.like_count
                    WHERE user_profile.user_id = OLD.user_id;
                ELSE
                    UPDATE user_profile
                    SET
                        post_count = user_profile.post_count + 1,
                        post_like_get_count = user_profile.post_like_get_count + OLD.like_count
                    WHERE user_profile.user_id = OLD.user_id;
                END IF;
            END IF;
    END CASE;
    RETURN NULL;
END; $$ LANGUAGE PLPGSQL;

CREATE TRIGGER post_trigger_mark_delete AFTER UPDATE OF is_delete ON post
    FOR EACH ROW
    WHEN (OLD.is_delete IS DISTINCT FROM NEW.is_delete)
    EXECUTE FUNCTION post_delete_trigger();

CREATE TRIGGER post_trigger_delete AFTER DELETE ON post
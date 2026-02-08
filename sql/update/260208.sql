-----------
--- 清理函数
-----------

DROP FUNCTION post_commit_review_post(INT, BOOLEAN, INT, TEXT);
DROP FUNCTION post_commit_review_comment(INT, BOOLEAN, INT, TEXT);
DROP FUNCTION post_set_to_reviewing(INT);
DROP FUNCTION post_set_comment_to_reviewing(INT);


-----------
--- 新增表和类型
-----------

CREATE TYPE review_status AS ENUM ('pending','passed','rejected');

CREATE TYPE review_target_type AS ENUM (
    'post', -- 帖子
    'post_comment' -- 评论
);

CREATE TABLE review(
  id SERIAL PRIMARY KEY,
  create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
  resolved_time TIMESTAMPTZ, -- 解决时间
  target_type review_target_type, -- 审核目标类型
  info JSONB NOT NULL, -- 额外信息
  review_display JSONB, -- 审核展示内容
  is_passed BOOLEAN, -- 是否通过审核
  is_reviewing BOOLEAN NOT NULL DEFAULT TRUE, -- 是否正在审核中
  pass_count INT NOT NULL DEFAULT 0, -- 通过审核的人数
  reject_count INT NOT NULL DEFAULT 0, -- 拒绝通过审核的人数

  comment VARCHAR(1000), -- 终审人审核意见
  reviewer_id INT REFERENCES public.user(id) ON DELETE SET NULL, -- 终审人。终审根据 review_record 决定最终结果.如果未空，可能是机器判断。

  CONSTRAINT chk_info_is_object CHECK (jsonb_typeof(info) = 'object'),
  CONSTRAINT chk_review_display_is_array CHECK (review_display IS NULL OR jsonb_typeof(review_display) = 'array')
);
CREATE INDEX idxfk_review_reviewer_id ON review(reviewer_id);
CREATE INDEX idx_review_list_query ON review(is_passed,create_time);
CREATE INDEX idx_review_list_type_query ON review(is_passed,target_type,create_time);

CREATE TABLE review_record(
  review_id INT NOT NULL REFERENCES review(id) ON DELETE CASCADE, -- 审核记录 id
  reviewer_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 审核人 id
  review_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 审核时间
  is_passed BOOLEAN NOT NULL, -- 是否通过审核
  comment VARCHAR(1000), -- 审核意见
  PRIMARY KEY (review_id, reviewer_id)
);
CREATE INDEX idxfk_reviewer_id ON review_record(reviewer_id);



-----------
--- 修改旧表
-----------

ALTER TABLE post
  ADD COLUMN review_status review_status,
  ADD COLUMN review_id INT REFERENCES review(id) ON DELETE SET NULL;

UPDATE post
  SET review_status = CASE 
      WHEN pr.is_review_pass = TRUE THEN 'passed'::review_status
      WHEN pr.is_review_pass = FALSE THEN 'rejected'::review_status
      ELSE NULL
    END
  FROM post_review_info as pr
  WHERE pr.target_id = post.id AND type='post';


ALTER TABLE post
  DROP COLUMN content_type,
  DROP COLUMN is_reviewing,
  DROP COLUMN is_review_pass;

DROP INDEX idx_post_get_list;
CREATE INDEX idxfk_post_review_id ON post(review_id) WHERE review_id IS NOT NULL;
CREATE INDEX idx_post_public_list ON post(review_status, is_delete, publish_time, id) WHERE is_delete=FALSE AND is_hide=FALSE;


ALTER TABLE post_comment 
  ADD COLUMN review_id INT REFERENCES review(id) ON DELETE SET NULL,
  ADD COLUMN review_status review_status;

ALTER INDEX idx_comment_user_insert_limit
  RENAME TO idx_post_comment_user_insert_limit;


DROP TABLE post_review_info;
DROP TYPE post_review_type;


DROP TABLE post_asset;
CREATE TABLE post_asset(
    post_id INT NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    index INT NOT NULL, -- 作品在列表中的索引
    level media_level, -- 媒体质量等级
    type media_type NOT NULL, -- 资源类型
    filename VARCHAR(200), -- 文件名

    PRIMARY KEY (post_id, index, level)
);
CREATE INDEX idxfk_post_asset_post_id ON post_asset(post_id,index);


-----------
--- 新增函数
-----------

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

SET client_encoding = 'UTF8';

/* 直接将指定帖子设置为审核中 */
CREATE OR REPLACE FUNCTION review_post_set_to_reviewing(arg_post_id INTEGER)
RETURNS INT AS $$
DECLARE
	new_review_id INT;
BEGIN
    SELECT review_id INTO new_review_id
        FROM post
        WHERE id = arg_post_id AND NOT is_delete;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'post id % not found or is deleted', arg_post_id;
    END IF;

    IF new_review_id IS NOT NULL THEN
			DELETE FROM review WHERE id = new_review_id;
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
        SET review_id = new_review_id,
					review_status = 'pending'::review_status
        WHERE id = arg_post_id;


    RETURN new_review_id;
END; $$ LANGUAGE PLPGSQL;


/* 直接将指定帖子的评论设置为审核中 */
CREATE OR REPLACE FUNCTION review_post_comment_set_to_reviewing(arg_comment_id INT)
RETURNS INT AS $$
DECLARE
	new_review_id INT;
BEGIN 
    SELECT review_id INTO new_review_id
        FROM post_comment
        WHERE id = arg_comment_id AND NOT is_delete;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'post comment id % not found or is deleted or already reviewed', arg_comment_id;
    END IF;

   IF new_review_id IS NOT NULL THEN
			DELETE FROM review WHERE id = new_review_id;
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
        SET review_id = new_review_id,
					review_status = 'pending'::review_status
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
	info JSONB;
	review_target_id INT;
BEGIN
  info := review_approve('post', arg_review_id, arg_is_pass, arg_reviewer_id, arg_remark);
	
	IF info IS NULL THEN
		RETURN 0;
	END IF;

	review_target_id := (info->>'target_id')::INT;
	IF review_target_id IS NULL THEN
		RAISE EXCEPTION 'review id % missing target_id info', arg_review_id;
	END IF;

	IF arg_is_pass THEN
		UPDATE post
			SET review_status = 'passed'::review_status
			WHERE id = review_target_id;
	ELSE 
		UPDATE post
			SET review_status = 'rejected'::review_status
			WHERE id = review_target_id;
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
	info JSONB;
	review_target_id INT;
BEGIN
  info := review_approve('post_comment', arg_review_id, arg_is_pass, arg_reviewer_id, arg_remark);
	
	IF info IS NULL THEN
		RETURN 0;
	END IF;

	review_target_id := (info->>'target_id')::INT;
	IF review_target_id IS NULL THEN
		RAISE EXCEPTION 'review id % missing target_id info', arg_review_id;
	END IF;
	
  IF arg_is_pass THEN
    UPDATE post_comment
      SET review_status= 'passed';
  ELSE
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

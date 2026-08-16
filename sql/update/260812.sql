ALTER TABLE post_comment RENAME TO comment;
ALTER TABLE post_comment_like RENAME TO comment_like;

ALTER TYPE comment_group_type ADD VALUE 'post';

CREATE TABLE _tree_map AS
SELECT
	p.id AS post_id,
	p.user_id AS owner_id,
  comment_num,
	nextval(pg_get_serial_sequence('comment_tree', 'id'))::INT AS comment_tree_id
FROM post AS p
WHERE p.comment_tree_id IS NULL AND NOT p.is_delete;

-- comment_tree 生成
INSERT INTO comment_tree(id,comment_total,owner_id,group_type) SELECT comment_tree_id,comment_num,owner_id,'post' FROM _tree_map;

-- post 表字段更改
ALTER TABLE post ADD COLUMN comment_tree_id INT REFERENCES comment_tree(id) ON DELETE SET NULL;
UPDATE TABLE post SET comment_tree_id = map.comment_tree_id FROM _tree_map AS map WHERE post.id = map.post_id;
ALTER TABLE post DROP COLUMN comment_num;

-- post_id -> comment_tree_id
ALTER TABLE comment ADD COLUMN comment_tree_id INT REFERENCES comment_tree(id) ON DELETE CASCADE;
UPDATE TABLE comment SET comment_tree_id = map.comment_tree_id FROM _tree_map AS map WHERE comment.post_id = map.post_id;
ALTER TABLE comment ADD CONSTRAINT comment_tree_id_not_null CHECK (comment_tree_id IS NOT NULL);
ALTER TABLE comment DROP COLUMN post_id, is_delete;


DROP TABLE _tree_map;

-- 索引重命名
DROP INDEX idxfk_post_comment_post_id;
DROP INDEX idxfk_post_comment_user_id;
DROP INDEX idxfk_post_comment_parent_comment_id;
DROP INDEX idxfk_post_comment_root_comment_id;
DROP INDEX idxfx_post_comment_review_id;
DROP INDEX idx_post_comment_user_insert_limit;

DROP INDEX idxfk_post_comment_like_user_id;


CREATE INDEX idxfk_comment_comment_tree_id ON comment(comment_tree_id,root_comment_id,parent_comment_id,create_time);
CREATE INDEX idxfk_comment_user_id ON comment(user_id);
CREATE INDEX idxfk_comment_parent_comment_id ON comment(parent_comment_id,create_time);
CREATE INDEX idxfk_comment_root_comment_id ON comment(root_comment_id,parent_comment_id,create_time);
CREATE INDEX idx_comment_user_insert_limit ON comment(user_id,create_time);

CREATE INDEX idxfk_comment_like_user_id ON comment_like(user_id);

CREATE TYPE review_status AS ENUM ('pending','passed','rejected');

CREATE TYPE review_target_type AS ENUM (
    'post', -- 帖子
    'post_comment', -- 评论
    'comment', -- 评论
    'question' -- 试题
);

CREATE TABLE review(
  id SERIAL PRIMARY KEY,
  create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
  target_type review_target_type, -- 审核目标类型
  info JSONB, -- 额外信息
  review_display JSONB, -- 审核展示内容
  is_passed BOOLEAN, -- 是否通过审核
  is_reviewing BOOLEAN NOT NULL DEFAULT TRUE, -- 是否正在审核中
  pass_count INT NOT NULL DEFAULT 0, -- 通过审核的人数
  reject_count INT NOT NULL DEFAULT 0, -- 拒绝通过审核的人数

  CONSTRAINT chk_info_is_object CHECK (info IS NULL OR jsonb_typeof(info) = 'object'),
  CONSTRAINT chk_review_display_is_array CHECK (review_display IS NULL OR jsonb_typeof(review_display) = 'array')
);
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
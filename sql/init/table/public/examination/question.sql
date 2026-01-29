CREATE TYPE exam_question_type AS ENUM (
    'single_choice', -- 单选题
    'multiple_choice', -- 多选题
    'true_false' -- 判断题 
); 

CREATE TABLE exam_question( -- 试题
    id INT NOT NULL PRIMARY KEY REFERENCES post(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id INT REFERENCES public.user(id) ON DELETE SET NULL ON UPDATE CASCADE, -- 出题人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    update_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 更新时间
    content_text VARCHAR(10000), -- 内容文本
    content_text_struct JSONB, -- 文本扩展信息
    question_type exam_question_type NOT NULL, -- 题目类型
    answer_index INT[] NOT NULL, -- 题目答案
    option_text VARCHAR[], -- 选项文本

    correct_count INT NOT NULL DEFAULT 0, -- 正确次数
    wrong_count INT NOT NULL DEFAULT 0, -- 错误次数
    question_level INT NOT NULL DEFAULT 0, -- 题目难度等级

    comment_id INT REFERENCES comment_tree(id) ON DELETE SET NULL, -- 题目评论 id
    review_id INT REFERENCES review(id) ON DELETE SET NULL, -- 审核记录 id
    review_status review_status -- 审核状态
);

CREATE INDEX idxfk_exam_question_user_id ON exam_question(user_id);
CREATE INDEX idxfk_exam_question_comment_id ON exam_question(comment_id);
CREATE INDEX idxfk_exam_question_review_id ON exam_question(review_id);

CREATE TABLE exam_question_media( -- 试题媒体资源
    question_id INT NOT NULL REFERENCES exam_question(id) ON DELETE CASCADE, -- 试题 id
    index INT NOT NULL, -- 试题在列表中的索引
    name VARCHAR(200), -- 媒体名称
    filename VARCHAR(200), -- 文件名
    type media_type NOT NULL, -- 资源类型
    PRIMARY KEY (question_id, index)
);

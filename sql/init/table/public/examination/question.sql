CREATE TYPE exam_question_type AS ENUM (
    'single_choice', -- 单选题
    'multiple_choice', -- 多选题
    'true_false' -- 判断题 
); 

CREATE TABLE exam_question( -- 试题
    id SERIAL PRIMARY KEY REFERENCES post(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id INT REFERENCES public.user(id) ON DELETE SET NULL ON UPDATE CASCADE, -- 出题人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    update_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 更新时间
    public_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 公开时间。题目对外公开的时间(刷题可见)，如果为空，表示不公开
    question_text VARCHAR(10000), -- 内容文本
    question_text_struct JSONB, -- 文本扩展信息
    question_type exam_question_type NOT NULL, -- 题目类型
    option_text VARCHAR[], -- 选项文本

    answer_index SMALLINT[] NOT NULL,    -- 题目答案
    answer_text VARCHAR(10000),     -- 答案解释文本
    answer_text_struct JSONB,       -- 答案解释文本扩展信息
    
    is_system_gen BOOLEAN NOT NULL DEFAULT FALSE, -- 是否系统生成
    event_time TIMESTAMPTZ, -- 事件时间。题目相关联的事件发生的事件
    long_time BOOLEAN NOT NULL DEFAULT FALSE, -- 题目是否长期有效。（有些题目会随着时间变化答案会发生变化，如果答案永远不会发生变化，则为长期有效）

    correct_count INT NOT NULL DEFAULT 0, -- 正确次数
    wrong_count INT NOT NULL DEFAULT 0, -- 错误次数
    difficulty_level SMALLINT NOT NULL DEFAULT 0, -- 题目难度等级, 范围 0~5. 
    collection_level SMALLINT NOT NULL DEFAULT 0, -- 题目特别等级。可选值为 0，1，2，3, 表示题目出得是不是很特别。刷题只能刷到 0 和 1 的题目 

    comment_id INT REFERENCES comment_tree(id) ON DELETE SET NULL, -- 题目评论 id
    review_id INT REFERENCES review(id) ON DELETE SET NULL, -- 审核记录 id
    review_status review_status -- 审核状态
);

CREATE INDEX idxfk_exam_question_user_id ON exam_question(user_id);
CREATE INDEX idxfk_exam_question_comment_id ON exam_question(comment_id);
CREATE INDEX idxfk_exam_question_review_id ON exam_question(is_system_gen, review_id);

CREATE TABLE exam_question_media( -- 试题媒体资源
    question_id INT NOT NULL REFERENCES exam_question(id) ON DELETE CASCADE, -- 试题 id
    index SMALLINT NOT NULL, -- 试题在列表中的索引。0 或正数属于选项，负数属于题目
    name VARCHAR(200), -- 媒体名称
    filename VARCHAR(200), -- 文件名
    type media_type NOT NULL, -- 资源类型
    PRIMARY KEY (question_id, index)
);

CREATE TABLE exam_question_hidden_list( -- 试题隐藏列表(对刷题不可见)
    question_id INT REFERENCES exam_question(id) ON DELETE CASCADE PRIMARY KEY -- 试题 id
);

CREATE TABLE exam_question_theme_bind(
    theme_id VARCHAR(100) NOT NULL, -- 主题名称
    question_id INT,
    PRIMARY KEY(theme_id, question_id)
);
CREATE INDEX idxfk_exam_question_theme_bind_question_id ON exam_question_theme_bind(question_id);
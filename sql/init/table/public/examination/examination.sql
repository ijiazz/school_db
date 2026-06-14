CREATE TABLE exam_paper_template(-- 试卷模板
    id SERIAL PRIMARY KEY,
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    question_total SMALLINT NOT NULL DEFAULT 0, -- 题库试题总数
    gen_rules JSONB -- 生成规则，记录每个难度的题目数量等信息
);
CREATE TABLE exam_paper_template_question( -- 试卷试题绑定
    index SMALLINT NOT NULL, -- 题目序号
    paper_template_id INT NOT NULL REFERENCES exam_paper_template(id) ON DELETE CASCADE, -- 试卷模板 id
    question_id INT REFERENCES exam_question(id) ON DELETE SET NULL, -- 试题 id
    score SMALLINT NOT NULL, -- 分数
    option_map INT [] , -- 选项映射, 打乱顺序
    PRIMARY KEY (paper_template_id, index),
    UNIQUE (paper_template_id, question_id)
);

CREATE TABLE examination(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 做题人 id

    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    title VARCHAR(100), -- 考试名
    question_total SMALLINT NOT NULL DEFAULT 0, -- 题库试题总数
    grade_total SMALLINT NOT NULL DEFAULT 0, -- 试卷总分
    template_id INT REFERENCES exam_paper_template(id) ON DELETE SET NULL, -- 试卷模板 id
    use_time_total_limit INT NOT NULL DEFAULT 0, -- 答题时间限制，单位毫秒，如果为0，表示不限制
    allow_time_start TIMESTAMPTZ, -- 允许做题的时间范围
    allow_time_end TIMESTAMPTZ, -- 允许做题的时间范围
    
    start_time TIMESTAMPTZ, -- 开始答题时间
    end_time TIMESTAMPTZ, -- 结束答题时间
    result_allow_view_date TIMESTAMPTZ, -- 结果允许查看考试结果的时间，如果为空，表示不限制
    
    grade SMALLINT, -- 成绩
    use_time_total INT NOT NULL DEFAULT 0, -- 答题总耗时，单位毫秒。
    correct_count SMALLINT NOT NULL DEFAULT 0, -- 正确题数
    wrong_count SMALLINT NOT NULL DEFAULT 0, -- 错误题数 

    CHECK(use_time_total >= 0),
    CHECK(use_time_total_limit >= 0)
);


CREATE TABLE examination_user_answer( -- 试卷作答
    exam_id INT NOT NULL REFERENCES examination(id) ON DELETE CASCADE, -- 试卷 id
    index SMALLINT NOT NULL, -- 题目序号
    score SMALLINT, -- 得分
    
    user_answer_select SMALLINT[], -- 用户选择的答案。如果为空，表示未答题
    start_time TIMESTAMPTZ, -- 开始答题时间
    use_time INT, -- 回答耗时，单位毫秒。
    PRIMARY KEY (exam_id, index),

    CHECK(use_time IS NULL OR use_time >= 0), -- 确保答题时间为正数或为空
    CHECK(user_answer_select IS NULL OR array_length(user_answer_select, 1) >= 0) -- 确保用户选择的答案为正数或为空
);

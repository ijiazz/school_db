CREATE TABLE exam_paper_template(-- 试卷模板
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 出题人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    title VARCHAR(100), -- 考试名称

    question_total INT NOT NULL DEFAULT 0, -- 题库试题总数

    use_time_total_limit INT NOT NULL DEFAULT 0, -- 答题时间限制，单位毫秒，如果为0，表示不限制
    allow_time_start TIMESTAMPTZ, -- 允许做题的时间范围
    allow_time_end TIMESTAMPTZ, -- 允许做题的时间范围

    CHECK(use_time_total_limit >= 0)  
);
CREATE TABLE exam_paper_question( -- 试卷试题绑定
    index INT NOT NULL, -- 题目序号
    paper_template_id INT NOT NULL REFERENCES exam_paper_template(id) ON DELETE CASCADE, -- 试卷模板 id
    question_id INT REFERENCES exam_question(id) ON DELETE SET NULL, -- 试题 id
    weight INT NOT NULL, -- 分数权重
    option_map INT [] , -- 选项映射, 打乱顺序
    PRIMARY KEY (paper_template_id, index),
    UNIQUE (paper_template_id, question_id)
);

CREATE TABLE exam_paper(
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 做题人 id
    template_id INT NOT NULL REFERENCES exam_paper_template(id) ON DELETE SET NULL, -- 试卷模板 id
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 开始答题时间
    end_time TIMESTAMPTZ, -- 结束答题时间

    use_time_total INT NOT NULL DEFAULT 0, -- 答题总耗时，单位毫秒。
    correct_count INT NOT NULL DEFAULT 0, -- 正确题数
    wrong_count INT NOT NULL DEFAULT 0, -- 错误题数 

    PRIMARY KEY (user_id, template_id),
    CHECK(use_time_total >= 0)
);


CREATE TABLE exam_paper_user_answer( -- 试卷作答
    paper_template_id INT NOT NULL REFERENCES exam_paper_template(id) ON DELETE CASCADE, -- 试卷 id
    index INT NOT NULL, -- 题目序号
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 用户 id

    user_answer_select INT[], -- 用户选择的答案
    start_time TIMESTAMPTZ, -- 开始答题时间
    use_time INT, -- 回答耗时，单位毫秒。如果为空，表示未答题
    PRIMARY KEY (paper_template_id, index, user_id),

    CHECK(use_time IS NULL OR use_time >= 0), -- 确保答题时间为正数或为空
    CHECK(user_answer_select IS NULL OR array_length(user_answer_select, 1) >= 0) -- 确保用户选择的答案为正数或为空
);

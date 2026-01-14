CREATE TABLE exam_question(
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 创建者 id
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- 是否删除
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    update_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 更新时间


    question_type VARCHAR(20) NOT NULL, -- 题目类型
    question_text VARCHAR NOT NULL, -- 题目文本
    question_image BYTEA, -- 题目图片
    question_audio BYTEA, -- 题目音频

    answer_index INT[] NOT NULL, -- 题目答案
    option_text VARCHAR[], -- 选项文本
    options_image BYTEA[], -- 附加图片

    review_pass_count INT NOT NULL DEFAULT 0, -- 审核通过次数
    review_fail_count INT NOT NULL DEFAULT 0, --  审核未通过次数
    is_review_pass BOOLEAN, -- 是否审核通过
    is_reviewing BOOLEAN NOT NULL DEFAULT FALSE, -- 是否审核中

    correct_count INT NOT NULL DEFAULT 0, -- 正确次数
    wrong_count INT NOT NULL DEFAULT 0, -- 错误次数
    question_level INT NOT NULL DEFAULT 0 -- 题目难度等级
); 

CREATE TABLE exam_question_review(
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 审核人 id
    question_id INT NOT NULL REFERENCES exam_question(id) ON DELETE CASCADE, -- 题目 id
    reason VARCHAR(100), -- 审核意见
    is_pass BOOLEAN NOT NULL DEFAULT FALSE, -- 是否通过
    PRIMARY KEY (user_id, question_id) 
);


CREATE TABLE exam_paper(    -- 试卷
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 出题人 id
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 做题人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    name VARCHAR(50), -- 考试名称
    question_total INT NOT NULL DEFAULT 0, -- 题目总数    
    use_time_total INT NOT NULL DEFAULT 0, -- 答题总耗时，单位毫秒。
    use_time_total_limit INT NOT NULL DEFAULT 0, -- 答题时间限制，单位毫秒，如果为0，表示不限制
    allow_time_start TIMESTAMPTZ, -- 允许做题的时间范围
    allow_time_end TIMESTAMPTZ, -- 允许做题的时间范围
    correct_count INT NOT NULL DEFAULT 0, -- 正确题数
    wrong_count INT NOT NULL DEFAULT 0, -- 错误题数 

    start_time TIMESTAMPTZ, -- 开始答题时间

    CHECK(use_time_total >= 0),
    CHECK(use_time_total_limit >= 0)  
);
CREATE TABLE exam_paper_question(
    paper_id INT NOT NULL REFERENCES exam_paper(id) ON DELETE CASCADE, -- 试卷 id
    question_id INT NOT NULL REFERENCES exam_question(id) ON DELETE CASCADE, -- 题目 id
    user_answer_select INT, -- 用户选择的答案 
    start_time TIMESTAMPTZ, -- 开始答题时间
    use_time INT, -- 回答耗时，单位毫秒。如果为空，表示未答题
    option_map INT [] , -- 选项映射, 打乱顺序
    PRIMARY KEY (paper_id, question_id),

    CHECK(user_answer_select IS NULL OR user_answer_select >= 0), -- 确保用户选择的答案为正数或为空
    CHECK(do_total_time IS NULL OR do_total_time >= 0) -- 确保答题时间为正数或为空
);


CREATE TABLE exam_competition( -- 竞赛
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMPTZ, -- 开始时间
    end_time TIMESTAMPTZ, -- 结束时间
    name VARCHAR(50) NOT NULL, -- 比赛名称
    participants_count INT NOT NULL DEFAULT 0, -- 参与人数
    difficulty_total INT[] -- 不同难度的题目数量
);


CREATE TABLE exam_competition_paper(
    competition_id INT NOT NULL REFERENCES exam_competition(id) ON DELETE CASCADE, -- 比赛 id
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 用户 id
    exam_paper_id INT REFERENCES exam_paper(id) ON DELETE SET NULL, -- 考试 id

    class_id INT REFERENCES class(id) ON DELETE SET NULL ON UPDATE CASCADE, -- 代表班级
    grade INT NOT NULL DEFAULT 0, -- 最终成绩
    do_total_time INT NOT NULL DEFAULT 0, -- 答题总耗时，单位毫秒。


    PRIMARY KEY (competition_id, user_id)
);
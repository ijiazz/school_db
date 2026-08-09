/**
 * @param input_array 输入的索引数组
 * @param map 映射数组
 * @return 映射后的值数组
 */
CREATE OR REPLACE FUNCTION array_map_index(input_array SMALLINT[], map SMALLINT[])
  RETURNS SMALLINT[] AS $$
  DECLARE 
  BEGIN 
    IF map IS NULL THEN
      RETURN input_array;
    END IF;
    RETURN (SELECT ARRAY_AGG(map[t.index + 1]) FROM unnest(input_array) AS t(index));
  END; $$ LANGUAGE PLPGSQL;

CREATE VIEW exam_question_real_option AS
SELECT question_id, index, text, media_type, media
FROM exam_question_option
WHERE index >= 0; -- 只包含选项，不包含题目附件

CREATE VIEW exam_question_attachment AS
SELECT question_id, (-index) AS index, text, media_type, media
FROM exam_question_option
WHERE index < 0; -- 只包含题目附件，不包含选项

CREATE TABLE exam_paper_template(-- 试卷模板
    id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 创建人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    gen_rules JSONB, -- 生成规则，记录每个难度的题目数量等信息
    exam_number INT NOT NULL DEFAULT 0 -- 关联的考试数量
);
CREATE TABLE exam_paper_template_question( -- 试卷试题绑定
    index SMALLINT NOT NULL, -- 题目序号
    paper_template_id INT NOT NULL REFERENCES exam_paper_template(id) ON DELETE CASCADE, -- 试卷模板 id
    question_id INT REFERENCES exam_question(id) ON DELETE SET NULL, -- 试题 id
    score SMALLINT NOT NULL, -- 分数
    time_limit SMALLINT, -- 答题时间限制，单位秒
    option_map SMALLINT[] , -- 选项映射, 打乱顺序
    PRIMARY KEY (paper_template_id, index),
    UNIQUE (paper_template_id, question_id)
);

CREATE VIEW exam_paper_template_question_view AS
    SELECT
        qb.*,
        q.question_type,
        q.question_text,
        q.question_text_struct,
        q.user_id,
        q.event_time,
        q.difficulty_level,
        q.comment_id,
        q.answer_text,
        q.answer_text_struct,
        array_map_index(q.answer_index::SMALLINT[], qb.option_map::SMALLINT[]) AS answer_index
    FROM  exam_paper_template_question qb INNER JOIN exam_question q ON qb.question_id = q.id;

CREATE TABLE examination(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 做题人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间

    title VARCHAR(100), -- 考试名
    question_total SMALLINT NOT NULL DEFAULT 0, -- 试题数量
    grade_total SMALLINT NOT NULL DEFAULT 0, -- 试卷总分
    template_id INT REFERENCES exam_paper_template(id) ON DELETE SET NULL, -- 试卷模板 id
    allow_time_start TIMESTAMPTZ, -- 考试的开始时间
    allow_time_end TIMESTAMPTZ, -- 考试的截止时间
    result_allow_view_date TIMESTAMPTZ, -- 结果允许查看考试结果的时间，如果为空，表示不限制
    use_time_total_limit INT NOT NULL DEFAULT 0, -- 答题时间限制，单位毫秒，如果为0，表示不限制。这是对 end_time - start_time 的限制
    effective_time_consumption INT DEFAULT 0, -- 有效答题时间消耗，单位毫秒，得分的题目耗时会计入有效答题时间消耗，未得分的题目不计入有效答题时间消耗。
    
    start_time TIMESTAMPTZ, -- 开始答题时间
    end_time TIMESTAMPTZ, -- 结束答题时间
    grade SMALLINT, -- 成绩

    CHECK(effective_time_consumption >= 0),
    CHECK(use_time_total_limit >= 0)
);


CREATE TABLE examination_user_answer( -- 试卷作答
    exam_id INT NOT NULL REFERENCES examination(id) ON DELETE CASCADE, -- 试卷 id
    index SMALLINT NOT NULL, -- 题目序号
    score SMALLINT, -- 得分
    
    user_answer_select SMALLINT[], -- 用户选择的答案。如果为空，表示未答题
    question_start_time TIMESTAMPTZ, -- 开始答题时间
    question_commit_time TIMESTAMPTZ, -- 结束答题时间
    PRIMARY KEY (exam_id, index)
);

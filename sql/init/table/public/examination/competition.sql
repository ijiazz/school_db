CREATE TABLE competition( -- 竞赛
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 发起人 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    publish_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 发布时间
    weight INT NOT NULL DEFAULT 0, -- 比赛权重，权重高的比赛排在前面
    name VARCHAR(50) NOT NULL, -- 比赛名称
    remark VARCHAR(200), -- 比赛备注

    registered_count INT NOT NULL DEFAULT 0, -- 报名人数
    participants_count INT NOT NULL DEFAULT 0, -- 参与人数
    ref_competition_id INT REFERENCES competition(id) ON DELETE SET NULL, -- 参考比赛 id

    comment_id INT REFERENCES comment_tree(id) ON DELETE SET NULL, -- 评论区 id
    start_time TIMESTAMPTZ, -- 竞赛开始时间
    end_time TIMESTAMPTZ, -- 竞赛结束时间

    time_limit INT NOT NULL DEFAULT 0, -- 答题时间限制，单位毫秒。如果为0，表示不限制
    question_total INT NOT NULL DEFAULT 0, -- 试题总数
    difficulty_total INT[] -- 不同难度的题目数量
);
CREATE INDEX idxfk_competition_ref_competition_id ON competition(ref_competition_id);
CREATE INDEX idxfk_competition_comment_id ON competition(comment_id);
CREATE INDEX idx_competition_owner_list ON competition(owner_id, create_time); -- 发起人比赛列表查询
CREATE INDEX idx_competition_global ON competition(weight, publish_time); -- 置顶比赛列表查询


CREATE TABLE competition_class_list( -- 竞赛班级统计
    competition_id INT NOT NULL REFERENCES competition(id) ON DELETE CASCADE, -- 比赛 id
    class_id INT NOT NULL REFERENCES class(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 班级 id
    prepare_rank INT, -- 班级准备阶段排名
    count INT NOT NULL, -- 该班级参加考试的人数
    grade INT, -- 班级总成绩
    rank INT, -- 班级总排名
    do_total_time INT, -- 班级总用时，单位毫秒

    PRIMARY KEY (class_id, competition_id)
);
CREATE INDEX idx_competition_class_list_list ON competition_class_list(competition_id, prepare_rank, class_id); -- 比赛班级列表查询
CREATE INDEX idx_competition_class_list_rank_list ON competition_class_list(competition_id, rank, class_id); -- 比赛班级排名查询

CREATE TABLE competition_user_list(
    competition_id INT NOT NULL REFERENCES competition(id) ON DELETE CASCADE, -- 比赛 id
    user_id INT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE, -- 用户 id
    create_time TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    class_id INT REFERENCES class(id) ON DELETE SET NULL ON UPDATE CASCADE, -- 代表班级
    prepare_rank INT, -- 班级准备阶段排名

    grade INT, -- 最终成绩
    rank INT, -- 最终排名
    do_total_time INT, -- 答题总耗时，单位毫秒。
    exam_paper_id INT REFERENCES exam_paper(id), -- 试卷 ID

    PRIMARY KEY (user_id, competition_id)
);

CREATE INDEX idx_competition_user_list_list ON competition_user_list(competition_id, prepare_rank, user_id); -- 比赛用户列表查询
CREATE INDEX idx_competition_user_list_rank_list ON competition_user_list(competition_id, rank, user_id); -- 比赛用户排名查询
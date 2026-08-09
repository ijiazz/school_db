import type { INT, SMALLINT, VARCHAR } from "../db_type.ts";
import type { DbExamQuestion } from "@/db/examination/question.ts";

export type DbExamPaperTemplate = {
  id: INT;
  owner_id: INT | null;
  create_time: Date;
  gen_rules: Record<string, any> | null;
  exam_number: INT;
};
export type DbExamPaperTemplateQuestion = {
  index: SMALLINT;
  paper_template_id: INT;
  question_id: INT | null;
  score: SMALLINT;
  time_limit: SMALLINT | null;
  option_map: SMALLINT[] | null;
};
export type DbExamPaperTemplateQuestionView =
  & DbExamPaperTemplateQuestion
  & Pick<
    DbExamQuestion,
    | "question_type"
    | "question_text"
    | "question_text_struct"
    | "user_id"
    | "event_time"
    | "difficulty_level"
    | "comment_id"
    | "answer_text"
    | "answer_text_struct"
    | "answer_index"
  >;
export type DbExamination = {
  id: INT;
  user_id: INT;

  create_time: Date;
  title: VARCHAR | null;
  question_total: SMALLINT;
  grade_total: SMALLINT;
  template_id: INT | null;

  allow_time_start: Date | null;
  allow_time_end: Date | null;
  result_allow_view_date: Date | null;

  start_time: Date | null;
  end_time: Date | null;
  use_time_total_limit: INT;

  grade: SMALLINT | null;
  effective_time_consumption: INT | null;
};

export type DbExaminationUserAnswer = {
  exam_id: INT;
  index: SMALLINT;
  score: SMALLINT | null;

  user_answer_select: SMALLINT[] | null;
  question_start_time: Date | null;
  question_commit_time: Date | null;
};

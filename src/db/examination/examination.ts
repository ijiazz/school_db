import type { INT, SMALLINT, VARCHAR } from "../db_type.ts";

export type DbExamPaperTemplate = {
  id: INT;
  create_time: Date;
  question_total: SMALLINT;
  gen_rules: Record<string, any> | null;
};
export type DbExamPaperTemplateQuestion = {
  index: SMALLINT;
  paper_template_id: INT;
  question_id: INT | null;
  weight: SMALLINT;
  option_map: SMALLINT[] | null;
};

export type DbExamination = {
  id: INT;
  user_id: INT;

  create_time: Date;
  title: VARCHAR | null;
  question_total: SMALLINT;
  grade_total: SMALLINT;
  template_id: INT | null;

  use_time_total_limit: INT;
  allow_time_start: Date | null;
  allow_time_end: Date | null;
  result_allow_view_date: Date | null;

  start_time: Date | null;
  end_time: Date | null;

  grade: SMALLINT | null;
  use_time_total: INT;
  correct_count: SMALLINT;
  wrong_count: SMALLINT;
};

export type DbExamPaperUserAnswer = {
  paper_id: INT;
  user_id: INT;
  score: SMALLINT | null;

  user_answer_select: SMALLINT[] | null;
  start_time: Date | null;
  use_time: INT | null;
};

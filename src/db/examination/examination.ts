import type { INT, VARCHAR } from "../db_type.ts";

export type DbExamPaperTemplate = {
  id: INT;
  owner_id: INT;
  create_time: Date;
  title: VARCHAR | null;

  question_total: INT;

  use_time_total_limit: INT;
  allow_time_start: Date | null;
  allow_time_end: Date | null;
};
export type DbExamPaper = {
  user_id: INT;
  template_id: INT;
  start_time: Date | null;
  end_time: Date | null;

  use_time_total: INT;
  correct_count: INT;
  wrong_count: INT;
};

export type DbExamPaperQuestion = {
  index: INT;
  paper_template_id: INT;
  question_id: INT | null;
  weight: INT;
  option_map: INT[] | null;
};

export type DbExamPaperUserAnswer = {
  paper_template_id: INT;
  user_id: INT;

  user_answer_select: INT[] | null;
  start_time: Date | null;
  use_time: INT | null;
};

import type { INT, VARCHAR } from "../db_type.ts";

export type ExamPaper = {
  id: INT;
  owner_id: INT;
  user_id: INT;
  create_time: Date;
  title: VARCHAR | null;

  question_total: INT;
  use_time_total: INT;
  correct_count: INT;
  wrong_count: INT;
  start_time: Date | null;
  end_time: Date | null;

  use_time_total_limit: INT;
  allow_time_start: Date | null;
  allow_time_end: Date | null;
};

export type ExamPaperQuestion = {
  paper_id: INT;
  question_id: INT | null;
  weight: INT;
  option_map: INT[] | null;
};

export type ExamPaperUserAnswer = {
  paper_id: INT;
  question_id: INT;
  user_id: INT;

  user_answer_select: INT[] | null;
  start_time: Date | null;
  use_time: INT | null;
};

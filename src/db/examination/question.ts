import type { BOOLEAN, INT, SMALLINT, VARCHAR } from "../db_type.ts";
import type { ReviewStatus } from "../review.ts";
import type { TextStructure } from "../type.ts";
import type { MediaType } from "../sys/file.ts";

export enum ExamQuestionType {
  SingleChoice = "single_choice",
  MultipleChoice = "multiple_choice",
  TrueOrFalse = "true_false",
}
export type DbExamQuestion = {
  id: INT;
  user_id: INT | null;
  create_time: Date;
  update_time: Date;

  question_text: VARCHAR;
  question_text_struct: TextStructure[];
  question_type: ExamQuestionType;
  option_text: VARCHAR[];

  answer_text: VARCHAR;
  answer_text_struct: TextStructure[];
  answer_index: INT[];

  is_system_gen: BOOLEAN;
  event_time: Date | null;
  long_time: BOOLEAN;

  correct_count: INT;
  wrong_count: INT;
  difficulty_level: SMALLINT;
  collection_level: SMALLINT;
  comment_id: INT | null;
  review_id: INT | null;
  review_status: ReviewStatus | null;
};

export type DbExamQuestionMedia = {
  question_id: INT;
  index: SMALLINT;
  title: VARCHAR | null;
  filename: VARCHAR | null;
  type: MediaType;
};

export type DbExamQuestionThemeBind = {
  theme_id: INT;
  question_id: INT;
};

export type DbExamQuestionHiddenList = {
  question_id: INT;
};

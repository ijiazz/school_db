import type { BOOLEAN, INT, VARCHAR } from "../db_type.ts";
import type { ReviewStatus } from "../review.ts";
import type { TextStructure } from "../type.ts";
import type { MediaType } from "../sys/file.ts";

export enum ExamQuestionType {
  SingleChoice = "single_choice",
  MultipleChoice = "multiple_choice",
  TrueOrFalse = "true_false",
}
export type ExamQuestion = {
  id: INT;
  user_id: INT | null;
  create_time: Date;
  update_time: Date;
  content_text: VARCHAR;
  content_text_struct: TextStructure;
  question_type: ExamQuestionType;
  answer_index: INT[];
  option_text: VARCHAR[];
  is_system_gen: BOOLEAN;
  event_time: Date | null;
  long_time: BOOLEAN;

  correct_count: INT;
  wrong_count: INT;
  question_level: INT;
  comment_id: INT | null;
  review_id: INT | null;
  review_status: ReviewStatus | null;
};

export type ExamQuestionMedia = {
  question_id: INT;
  index: INT;
  name: VARCHAR | null;
  filename: VARCHAR | null;
  type: MediaType;
};

export type ExamQuestionTheme = {
  id: INT;
  name: VARCHAR | null;
};

export type ExamQuestionThemeBind = {
  theme_id: INT;
  question_id: INT;
};

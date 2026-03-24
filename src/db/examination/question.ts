import type { BOOLEAN, INT, SMALLINT, VARCHAR } from "../db_type.ts";
import type { ReviewStatus } from "../review.ts";
import type { TextStructure } from "../type.ts";

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

export type DbExamQuestionOption =
  & {
    question_id: INT;
    index: SMALLINT;
    text: VARCHAR | null;
  }
  & (
    | {
      media_type: string;
      media: Uint8Array;
    }
    | {
      media_type: null;
      media: null;
    }
  );

export type DbExamQuestionThemeBind = {
  theme_id: VARCHAR;
  question_id: INT;
};

export type DbExamQuestionHiddenList = {
  question_id: INT;
};

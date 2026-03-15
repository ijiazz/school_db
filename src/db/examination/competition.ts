import type { INT, VARCHAR } from "../db_type.ts";

export type DbCompetition = {
  id: INT;
  owner_id: INT;
  create_time: Date;
  publish_time: Date;
  weight: INT;
  name: VARCHAR;
  remark: VARCHAR | null;

  registered_count: INT;
  participants_count: INT;
  ref_competition_id: INT | null;

  comment_id: INT | null;
  start_time: Date | null;
  end_time: Date | null;

  time_limit: INT;
  question_total: INT;
  difficulty_total: INT[] | null;
};

export type DbCompetitionClassList = {
  competition_id: INT;
  class_id: INT;
  prepare_rank: INT | null;
  count: INT;
  grade: INT | null;
  rank: INT | null;
  do_total_time: INT | null;
};

export type DbCompetitionUserList = {
  competition_id: INT;
  user_id: INT;
  create_time: Date;
  class_id: INT | null;
  prepare_rank: INT | null;

  grade: INT | null;
  rank: INT | null;
  do_total_time: INT | null;
  exam_paper_id: INT | null;
};

export type DbCompetitionQuestionStat = {
  competition_id: INT;
  question_id: INT | null;
  count: INT;
  error_count: INT;
};

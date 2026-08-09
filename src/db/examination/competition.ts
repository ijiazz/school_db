import type { INT, SMALLINT, VARCHAR } from "../db_type.ts";

export type DbCompetition = {
  id: INT;
  owner_id: INT;
  create_time: Date;
  publish_time: Date;
  weight: SMALLINT;
  name: VARCHAR;
  remark: VARCHAR | null;

  registered_count: INT;
  participants_count: INT;
  ref_competition_id: INT | null;

  comment_id: INT | null;
  start_time: Date | null;
  end_time: Date | null;

  time_limit: INT;
  question_total: SMALLINT;
  difficulty_total: SMALLINT[] | null;
};

export type DbCompetitionClass = {
  competition_id: INT;
  class_id: INT;
  prepare_rank: INT | null;
  count: INT;
  grade: SMALLINT | null;
  rank: INT | null;
  do_total_time: INT | null;
};

export type DbCompetitionUser = {
  competition_id: INT;
  user_id: INT;
  create_time: Date;
  class_id: INT | null;
  prepare_rank: INT | null;

  grade: SMALLINT | null;
  rank: INT | null;
  do_total_time: INT | null;
  examination_id: INT | null;
};

export type DbCompetitionQuestionStat = {
  competition_id: INT;
  question_id: INT | null;
  count: INT;
  error_count: INT;
};

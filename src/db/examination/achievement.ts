import type { INT, VARCHAR } from "../db_type.ts";

export enum AchievementType {
  exam_certificate = "exam_certificate",
}

export type DbAchievement = {
  id: INT;
  name: VARCHAR;
  type: AchievementType;
  method_desc: VARCHAR | null;
};
export type DbAchievementCert = {
  id: INT;
  achievement_id: INT;
  create_time: Date;
};

export type DbAchievementUserBind = {
  cert_id: INT;
  user_id: INT;
};

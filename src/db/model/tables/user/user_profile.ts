import type { InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("SERIAL", true),
  live_notice: dbTypeMap.genColumn("BOOLEAN", true, "'FALSE'"),
  acquaintance_time: dbTypeMap.genColumn("TIMESTAMP"),
  comment_stat_enabled: dbTypeMap.genColumn("BOOLEAN", true, "'FALSE'"),

  /** 发帖数 */
  post_count: dbTypeMap.genColumn("INT", true, "0"),
  /** 用户点赞的总帖子数 */
  post_like_count: dbTypeMap.genColumn("INT", true, "0"),
  /** 用户帖子获得的总数量 */
  post_like_get_count: dbTypeMap.genColumn("INT", true, "0"),

  /** 举报正确数 (客观类，容易判断正确性的，包括帖子、用户) */
  report_correct_count: dbTypeMap.genColumn("INT", true, "0"),
  /** 举报错误数 (客观类，容易判断正确性的，包括帖子、用户) */
  report_error_count: dbTypeMap.genColumn("INT", true, "0"),
  /** 举报正确数 (主观类，包括评论) */
  report_subjective_correct_count: dbTypeMap.genColumn("INT", true, "0"),
  /** 举报错误数 (主观类，包括评论) */
  report_subjective_error_count: dbTypeMap.genColumn("INT", true, "0"),
} satisfies TableDefined;

export type DbUserProfile = InferTableDefined<typeof TABLE_DEFINE>;

export type DbUserProfileCreate = Partial<Omit<DbUserProfile, "user_id">> & { user_id: number };

export const user_profile = createTable<DbUserProfile, DbUserProfileCreate>("public.user_profile", TABLE_DEFINE);

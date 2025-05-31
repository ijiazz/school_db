import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("SERIAL", true),
  live_notice: dbTypeMap.genColumn("BOOLEAN", true, "'FALSE'"),
  acquaintance_time: dbTypeMap.genColumn("TIMESTAMP"),
  comment_stat_enabled: dbTypeMap.genColumn("BOOLEAN", true, "'FALSE'"),
} satisfies TableDefined;

export type DbUserProfile = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserProfileCreate = PickColumn<
  DbUserProfile,
  "user_id",
  "acquaintance_time" | "comment_stat_enabled" | "live_notice"
>;

export const user_profile = createTable<DbUserProfile, DbUserProfileCreate>("public.user_profile", TABLE_DEFINE);

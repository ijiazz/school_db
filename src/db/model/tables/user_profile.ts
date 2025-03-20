import type { InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("SERIAL", true),
  live_notice: dbTypeMap.genColumn("BOOLEAN"),
} satisfies TableDefined;

export type DbUserProfile = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserProfileCreate = DbUserProfile;

export const user_profile = createTable<DbUserProfile, DbUserProfileCreate>("public.user_profile", TABLE_DEFINE);

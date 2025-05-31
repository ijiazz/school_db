import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("INT", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  is_primary: dbTypeMap.genColumn("BOOLEAN"),
} satisfies TableDefined;

export type DbUserPlatformBind = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserPlatformBindCreate = ToInsertType<DbUserPlatformBind, "create_time">;

export const user_platform_bind = createTable<DbUserPlatformBind, DbUserPlatformBindCreate>(
  "user_platform_bind",
  TABLE_DEFINE,
);

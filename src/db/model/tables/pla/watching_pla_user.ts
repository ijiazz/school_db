import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
const TABLE = {
  published_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  published_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  level: dbTypeMap.genColumn("SMALLINT"),

  visible_time_second: dbTypeMap.genColumn("INT"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;

export type DbWatchingPlaUser = InferTableDefined<typeof TABLE>;
export type DbWatchingPlaUserCreate = ToInsertType<DbWatchingPlaUser>;

export const watching_pla_user = createTable<DbWatchingPlaUser, DbWatchingPlaUserCreate>("watching_pla_user", TABLE);

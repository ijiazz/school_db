import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";
const watching_pla_userDefine = {
  published_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  published_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  level: dbTypeMap.genColumn("SMALLINT"),

  visible_time_second: dbTypeMap.genColumn("INT"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;

export type DbWatchingPlaUser = InferTableDefined<typeof watching_pla_userDefine>;
export type DbWatchingPlaUserCreate = PickColumn<
  DbWatchingPlaUser,
  "pla_uid" | "platform" | "level" | "visible_time_second"
>;

export const watching_pla_user = createTable<DbWatchingPlaUser, DbWatchingPlaUserCreate>(
  "watching_pla_user",
  watching_pla_userDefine,
);

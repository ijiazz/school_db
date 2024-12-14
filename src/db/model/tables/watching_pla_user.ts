import { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";
const watching_pla_userDefine = {
  published_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  published_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  level: dbTypeMap.genColumn("SMALLINT"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;

const pla_userCreateKeys = ["pla_uid", "platform", "level"] as const;

export type DbWatchingPlaUser = InferTableDefined<typeof watching_pla_userDefine>;
export type DbWatchingPlaUserCreate = PickColumn<DbWatchingPlaUser, "pla_uid" | "platform" | "level">;

export const watching_pla_user = createTable<DbWatchingPlaUser, DbWatchingPlaUserCreate>(
  "watching_pla_user",
  watching_pla_userDefine,
);

export const watching_pla_user_check = watching_pla_user.createTypeChecker<DbWatchingPlaUserCreate>(pla_userCreateKeys);

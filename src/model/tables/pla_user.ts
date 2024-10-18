import { PickColumn, InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap, sqlValue } from "../_sql_value.ts";
import { UserExtra } from "../type.ts";
export const pla_userDefine = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  published_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  published_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  extra: dbTypeMap.genColumn<UserExtra>("JSONB", true, sqlValue({})),
  pla_avatar_uri: dbTypeMap.genColumn("VARCHAR"),
  level: dbTypeMap.genColumn("SMALLINT", true, "-32768"),

  user_name: dbTypeMap.genColumn("VARCHAR"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  avatar: dbTypeMap.genColumn("VARCHAR"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  uid: dbTypeMap.genColumn("BIGINT"),
} satisfies TableDefined;
const createRequiredKeys = ["avatar", "pla_avatar_uri", "pla_uid", "platform", "user_name", "ip_location"] as const;
const createOptionalKeys = ["level", "extra"] as const;

const pla_userCreateKeys = [...createRequiredKeys, ...createOptionalKeys] as const;

export type DbPlaUser = InferTableDefined<typeof pla_userDefine>;
export type DbPlaUserCreate = PickColumn<
  DbPlaUser,
  "avatar" | "pla_avatar_uri" | "pla_uid" | "platform" | "user_name" | "ip_location",
  "level" | "extra"
>;

export const pla_user = createTable<DbPlaUser, DbPlaUserCreate>("pla_user", pla_userDefine);

export const pla_user_check = pla_user.createTypeChecker<DbPlaUserCreate>(pla_userCreateKeys);

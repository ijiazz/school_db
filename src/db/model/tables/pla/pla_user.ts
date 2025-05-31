import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { UserExtra } from "../../type.ts";
const TABLE_DEFINE = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  extra: dbTypeMap.genColumn<UserExtra>("JSONB", true, "'{}'"),
  pla_avatar_uri: dbTypeMap.genColumn("VARCHAR"),

  user_name: dbTypeMap.genColumn("VARCHAR"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  avatar: dbTypeMap.genColumn("VARCHAR"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  follower_count: dbTypeMap.genColumn("INT"),
  following_count: dbTypeMap.genColumn("INT"),
  signature: dbTypeMap.genColumn("VARCHAR"),
  signature_struct: dbTypeMap.genColumn("JSONB"),
} satisfies TableDefined;
const createRequiredKeys = ["avatar", "pla_avatar_uri", "pla_uid", "platform", "user_name", "ip_location"] as const;
const createOptionalKeys = ["extra"] as const;

const TABLE_CREATE_KEY = [...createRequiredKeys, ...createOptionalKeys] as const;

export type DbPlaUser = InferTableDefined<typeof TABLE_DEFINE>;
export type DbPlaUserCreate = ToInsertType<DbPlaUser, "create_time" | "crawl_check_time" | "extra">;

export const pla_user = createTable<DbPlaUser, DbPlaUserCreate>("pla_user", TABLE_DEFINE);

export const pla_user_check = pla_user.createTypeChecker<DbPlaUserCreate>(TABLE_CREATE_KEY);

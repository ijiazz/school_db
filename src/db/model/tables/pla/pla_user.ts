import type { TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { Platform, UserExtra } from "./init.ts";
import type { TextStructure } from "../../type.ts";

export type DbPlaUser = {
  create_time: Date;
  crawl_check_time: Date;
  extra: UserExtra;
  pla_avatar_uri: string | null;
  user_name: string | null;
  ip_location: string | null;
  avatar: string | null;
  pla_uid: string;
  platform: Platform;
  follower_count: number | null;
  following_count: number | null;
  signature: string | null;
  signature_struct: TextStructure[] | null;
};
export type DbPlaUserCreate = ToInsertType<DbPlaUser, "create_time" | "crawl_check_time" | "extra">;

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

export const pla_user = createTable<DbPlaUser, DbPlaUserCreate>("pla_user", TABLE_DEFINE);

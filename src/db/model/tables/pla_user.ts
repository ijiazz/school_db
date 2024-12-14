import { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";
import { UserExtra } from "../type.ts";
import { v } from "../../extend_sql_chain.ts";
export const pla_userDefine = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  extra: dbTypeMap.genColumn<UserExtra>("JSONB", true, v({})),
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

const pla_userCreateKeys = [...createRequiredKeys, ...createOptionalKeys] as const;

export type DbPlaUser = InferTableDefined<typeof pla_userDefine>;
export type DbPlaUserCreate = PickColumn<
  DbPlaUser,
  | "avatar"
  | "pla_avatar_uri"
  | "pla_uid"
  | "platform"
  | "user_name"
  | "ip_location"
  | "follower_count"
  | "following_count"
  | "signature"
  | "signature_struct",
  "extra"
>;

export const pla_user = createTable<DbPlaUser, DbPlaUserCreate>("pla_user", pla_userDefine);

export const pla_user_check = pla_user.createTypeChecker<DbPlaUserCreate>(pla_userCreateKeys);

const user_avatar_define = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  ref_count: dbTypeMap.genColumn("INTEGER", true),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),
  size: dbTypeMap.genColumn("SMALLINT", true),
} satisfies TableDefined;

export type DbUserAvatar = InferTableDefined<typeof user_avatar_define>;
export type DbUserAvatarCreate = PickColumn<DbUserAvatar, "image_height" | "image_width" | "id" | "size">;

export const user_avatar = createTable<DbUserAvatar, DbUserAvatarCreate>("user_avatar", user_avatar_define);

import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const TABLE_DEFINE = {
  id: dbTypeMap.genColumn("SERIAL", true),
  nickname: dbTypeMap.genColumn("VARCHAR"),
  avatar: dbTypeMap.genColumn("VARCHAR"),
  email: dbTypeMap.genColumn("VARCHAR", true),
  password: dbTypeMap.genColumn("CHAR"),
  pwd_salt: dbTypeMap.genColumn("CHAR"),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  is_deleted: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),
} satisfies TableDefined;

const TABLE_CREATE_KEYS = ["nickname", "avatar", "email", "password", "pwd_salt"] as const;

export type DbUser = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserCreate = PickColumn<DbUser, (typeof TABLE_CREATE_KEYS)[number]>;

export const user = createTable<DbUser, DbUserCreate>("public.user", TABLE_DEFINE);

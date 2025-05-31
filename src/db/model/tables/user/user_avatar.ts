import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  ref_count: dbTypeMap.genColumn("INTEGER", true, "0"),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),
  size: dbTypeMap.genColumn("SMALLINT", true),
} satisfies TableDefined;

export type DbUserAvatar = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserAvatarCreate = ToInsertType<DbUserAvatar, "ref_count">;

export const user_avatar = createTable<DbUserAvatar, DbUserAvatarCreate>("user_avatar", TABLE_DEFINE);

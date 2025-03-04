import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const TABLE_DEFINE = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  ref_count: dbTypeMap.genColumn("INTEGER", true),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),
  size: dbTypeMap.genColumn("SMALLINT", true),
} satisfies TableDefined;

export type DbUserAvatar = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserAvatarCreate = PickColumn<DbUserAvatar, "image_height" | "image_width" | "id" | "size">;

export const user_avatar = createTable<DbUserAvatar, DbUserAvatarCreate>("user_avatar", TABLE_DEFINE);

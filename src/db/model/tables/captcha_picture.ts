import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const TABLE_DEFINE = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  type: dbTypeMap.genColumn("VARCHAR"),
  is_true: dbTypeMap.genColumn("BOOLEAN"),
  yes_count: dbTypeMap.genColumn("INT", true, "0"),
  no_count: dbTypeMap.genColumn("INT", true, "0"),
} satisfies TableDefined;

export type DbCaptchaPicture = InferTableDefined<typeof TABLE_DEFINE>;
export type DbCaptchaPictureCreate = PickColumn<DbCaptchaPicture, "id" | "type" | "is_true", "yes_count" | "no_count">;

export const captcha_picture = createTable<DbCaptchaPicture, DbCaptchaPictureCreate>("captcha_picture", TABLE_DEFINE);

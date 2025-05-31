import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  size: dbTypeMap.genColumn("INT"),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),

  ref_count: dbTypeMap.genColumn("SMALLINT", true, "0"),
} satisfies TableDefined;
export type DbCommentImage = InferTableDefined<typeof TABLE>;
export type DbDbCommentImageCreate = ToInsertType<DbCommentImage, "ref_count">;
export const comment_image = createTable<DbCommentImage, DbDbCommentImageCreate>("comment_image", TABLE);

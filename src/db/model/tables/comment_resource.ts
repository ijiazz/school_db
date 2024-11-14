import { InferTableDefined, TableDefined, PickColumn } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const comment_imageDefined = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  size: dbTypeMap.genColumn("INT"),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),

  ref_count: dbTypeMap.genColumn("SMALLINT", true),
  level: dbTypeMap.genColumn("media_level"),
} satisfies TableDefined;
export type DbCommentImage = InferTableDefined<typeof comment_imageDefined>;
export type DbDbCommentImageCreate = PickColumn<
  DbCommentImage,
  "id" | "size" | "level" | "image_width" | "image_height"
>;
export const comment_image = createTable<DbCommentImage, DbDbCommentImageCreate>("comment_image", comment_imageDefined);

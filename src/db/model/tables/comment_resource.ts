import { InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const comment_imageDefined = {
  platform: dbTypeMap.genColumn("platform_flag"),
  comment_id: dbTypeMap.genColumn("VARCHAR"),
  uri: dbTypeMap.genColumn("VARCHAR", true),
  index: dbTypeMap.genColumn("SMALLINT", true),
  level: dbTypeMap.genColumn("media_level", true),
} satisfies TableDefined;
export type DbCommentImage = InferTableDefined<typeof comment_imageDefined>;
export type DbDbCommentImageCreate = DbCommentImage;
export const comment_image = createTable<DbCommentImage, DbDbCommentImageCreate>("comment_image", comment_imageDefined);

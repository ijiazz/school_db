import { PickColumn, InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const file_image_define = {
  uri: dbTypeMap.genColumn("VARCHAR", true),
  ref_count: dbTypeMap.genColumn("INTEGER", true),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),
} satisfies TableDefined;

export type DbFileImage = InferTableDefined<typeof file_image_define>;
export type DbFileImageCreate = PickColumn<DbFileImage, "image_height" | "image_width" | "uri">;

export const file_image = createTable<DbFileImage, DbFileImageCreate>("file_image", file_image_define);

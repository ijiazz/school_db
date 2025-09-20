import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { TextStructure } from "@/db/model/types/extra.ts";

const DEFINE = {
  id: dbTypeMap.genColumn("SERIAL", true),
  group_id: dbTypeMap.genColumn("INT"),
  user_id: dbTypeMap.genColumn("INT", true),
  is_delete: dbTypeMap.genColumn("BOOLEAN", true, "'false'"),
  is_hide: dbTypeMap.genColumn("BOOLEAN", true, "'false'"),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  update_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  publish_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_text_struct: dbTypeMap.genColumn<TextStructure>("JSONB"),
  content_type: dbTypeMap.genColumn("BIT(8)", true, "0::BIT(8)"),
  like_count: dbTypeMap.genColumn("INT", true, "0"),
  dislike_count: dbTypeMap.genColumn("SMALLINT", true, "0"),
  comment_num: dbTypeMap.genColumn("INT", true, "0"),
  options: dbTypeMap.genColumn("BIT(8)", true, "0::BIT(8)"),
  is_reviewing: dbTypeMap.genColumn("BOOLEAN", true, "'false'"),
  is_review_pass: dbTypeMap.genColumn("BOOLEAN"),
} satisfies TableDefined;
export type DbPost = InferTableDefined<typeof DEFINE>;
export type DbPostCreate = Omit<
  ToInsertType<
    DbPost,
    | "is_delete"
    | "is_hide"
    | "create_time"
    | "update_time"
    | "content_type"
    | "like_count"
    | "dislike_count"
    | "comment_num"
    | "options"
    | "is_reviewing"
  >,
  "id"
>;
export const post = createTable<DbPost, DbPostCreate>("post", DEFINE);

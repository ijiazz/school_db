import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import { TextStructure } from "../../type.ts";

const DEFINE = {
  id: dbTypeMap.genColumn("SERIAL", true),
  root_comment_id: dbTypeMap.genColumn("INT"),
  parent_comment_id: dbTypeMap.genColumn("INT"),
  is_root_reply_count: dbTypeMap.genColumn("INT", true, "0"),
  reply_count: dbTypeMap.genColumn("INT", true, "0"),
  post_id: dbTypeMap.genColumn("INT", true),
  user_id: dbTypeMap.genColumn("INT", true),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  is_delete: dbTypeMap.genColumn("BOOLEAN", true, "'false'"),
  like_count: dbTypeMap.genColumn("INT", true, "0"),
  dislike_count: dbTypeMap.genColumn("SMALLINT", true, "0"),
  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_text_struct: dbTypeMap.genColumn<TextStructure>("JSONB"),
} satisfies TableDefined;
export type DbPostComment = InferTableDefined<typeof DEFINE>;
export type DbPostCommentCreate = ToInsertType<
  DbPostComment,
  "id" | "create_time" | "is_delete" | "dislike_count" | "like_count" | "is_root_reply_count" | "reply_count"
>;

export const post_comment = createTable<DbPostComment, DbPostCommentCreate>("post_comment", DEFINE);

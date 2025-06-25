import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  comment_id: dbTypeMap.genColumn("INT"),
  user_id: dbTypeMap.genColumn("INT"),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  weight: dbTypeMap.genColumn("SMALLINT", true),
  reason: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;
export type DbPostCommentLike = InferTableDefined<typeof DEFINE>;
export type DbPostCommentLikeCreate = ToInsertType<DbPostCommentLike, "create_time">;
export const post_comment_like = createTable<DbPostCommentLike, DbPostCommentLikeCreate>("post_comment_like", DEFINE);

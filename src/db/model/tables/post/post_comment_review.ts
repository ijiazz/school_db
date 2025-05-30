import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  comment_id: dbTypeMap.genColumn("INT", true),
  user_id: dbTypeMap.genColumn("INT", true),
  commit_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  is_pass: dbTypeMap.genColumn("BOOLEAN", true, "'false'"),
  reason: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;
export type DbPostCommentReview = InferTableDefined<typeof DEFINE>;
export type DbPostCommentReviewCreate = ToInsertType<
  DbPostCommentReview,
  "commit_time" | "is_pass"
>;

export const post_comment_review = createTable<DbPostCommentReview, DbPostCommentReviewCreate>(
  "post_comment_review",
  DEFINE,
);

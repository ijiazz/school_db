import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  comment_id: dbTypeMap.genColumn("INT", true),
  commit_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  review_fail_count: dbTypeMap.genColumn("INT", true, "0"),
  review_pass_count: dbTypeMap.genColumn("INT", true, "0"),
  is_review_pass: dbTypeMap.genColumn("BOOLEAN"),
} satisfies TableDefined;
export type DbPostCommentReviewResult = InferTableDefined<typeof DEFINE>;
export type DbPostCommentReviewResultCreate = ToInsertType<
  DbPostCommentReviewResult,
  "review_fail_count" | "review_pass_count"
>;

export const post_comment_review_result = createTable<DbPostCommentReviewResult, DbPostCommentReviewResultCreate>(
  "post_comment_review_result",
  DEFINE,
);

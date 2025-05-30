import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  post_update_time: dbTypeMap.genColumn("TIMESTAMPTZ", true),
  post_id: dbTypeMap.genColumn("INT", true),
  user_id: dbTypeMap.genColumn("INT", true),
  commit_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  is_pass: dbTypeMap.genColumn("BOOLEAN", true, "'false'"),
  reason: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;
export type DbPostReview = InferTableDefined<typeof DEFINE>;
export type DbPostReviewCreate = ToInsertType<DbPostReview, "commit_time" | "is_pass">;
export const post_review = createTable<DbPostReview, DbPostReviewCreate>("post_review", DEFINE);

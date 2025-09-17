import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  type: dbTypeMap.genColumn("post_review_type", true), // 审核类型
  target_id: dbTypeMap.genColumn("INT", true), // 目标id
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"), // 创建时间
  reviewed_time: dbTypeMap.genColumn("TIMESTAMPTZ"), // 审核提交时间
  reviewer_id: dbTypeMap.genColumn("INT", true), // 审核人id
  is_review_pass: dbTypeMap.genColumn("BOOLEAN"),
  remark: dbTypeMap.genColumn("VARCHAR"), // 审核备注
} satisfies TableDefined;
export type DbPostReviewInfo = InferTableDefined<typeof DEFINE>;
export type DbPostReviewInfoCreate = ToInsertType<DbPostReviewInfo, "reviewed_time" | "reviewer_id">;

export const post_review_info = createTable<DbPostReviewInfo, DbPostReviewInfoCreate>("post_review_info", DEFINE);

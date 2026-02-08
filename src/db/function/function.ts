import type { BOOL, INT, NULL, VARCHAR } from "../db_type.ts";

export interface DbFunctions {
  file_update_ref_count(old_filepath: VARCHAR | NULL, new_filepath: VARCHAR | NULL): INT;
  file_update_ref_count(
    old_bucket: VARCHAR | NULL,
    old_filename: VARCHAR | NULL,
    new_bucket: VARCHAR | NULL,
    new_filename: VARCHAR | NULL,
  ): INT;
}

export interface DbFunctions {
  /** 提交审核 */
  review_commit(review_id: INT, reviewer_id: INT, is_passed: BOOL, comment: VARCHAR | NULL): INT;
  /** 最终审批 */
  review_approve(review_id: INT, reviewer_id: INT, is_passed: BOOL, comment: VARCHAR | NULL): INT;
}

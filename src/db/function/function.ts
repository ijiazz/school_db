import type { BOOL, INT, NULL, VARCHAR } from "../db_type.ts";
import type { ReviewTargetType } from "../review.ts";

export interface DbFunctions {
  file_update_ref_count(
    old_filepath: VARCHAR | NULL,
    new_filepath: VARCHAR | NULL,
  ): INT;
  file_update_ref_count(
    old_bucket: VARCHAR | NULL,
    old_filename: VARCHAR | NULL,
    new_bucket: VARCHAR | NULL,
    new_filename: VARCHAR | NULL,
  ): INT;
}

export interface DbFunctions {
  review_commit(review_id: INT, reviewer_id: INT, is_passed: BOOL, comment: VARCHAR | NULL): INT;
  review_insert_record_check_old(
    review_id: INT | NULL,
    arg_target_type: ReviewTargetType,
    arg_info: object | NULL,
    arg_review_display: object | NULL,
  ): INT;
}

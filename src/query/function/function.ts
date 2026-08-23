import type { BOOL, INT, NULL, TEXT, VARCHAR } from "../../db/db_type.ts";
import type { ReviewStatus, ReviewTargetType } from "../../db/review.ts";

interface DbFunctions {
  file_update_ref_count(old_filepath: VARCHAR | NULL, new_filepath: VARCHAR | NULL): INT;
  file_update_ref_count(
    old_bucket: VARCHAR | NULL,
    old_filename: VARCHAR | NULL,
    new_bucket: VARCHAR | NULL,
    new_filename: VARCHAR | NULL,
  ): INT;
}

interface DbFunctions {
  /** 提交审核 */
  review_commit(review_id: INT, reviewer_id: INT, is_passed: BOOL, comment: VARCHAR | NULL): INT;
  /** 最终审批 */
  review_approve(
    target_type: ReviewTargetType,
    review_id: INT,
    is_passed: BOOL,
    reviewer_id: INT,
    remark: TEXT | NULL,
  ): Record<string, unknown> | NULL;
  review_status_is_progress(review_status: ReviewStatus | NULL): BOOL;

  review_comment_set_to_reviewing(comment_id: INT): INT;
  review_comment_commit(review_id: INT, is_passed: BOOL, reviewer_id: INT, remark: TEXT | NULL): INT;
  review_post_set_to_reviewing(post_id: INT): INT;
  review_post_commit(review_id: INT, is_passed: BOOL, reviewer_id: INT, remark: TEXT | NULL): INT;
  review_question_set_to_reviewing(question_id: INT): INT;
}

interface DbFunctions {
  comment_delete(comment_id: INT, user_id: INT | NULL): INT;
  comment_delete_mark(comment_id: INT): INT;
  comment_recursive_delete(comment_id: INT): INT;
}

interface DbFunctions {
  post_delete(post_id: INT, user_id: INT | NULL): INT;
}

export type { DbFunctions };

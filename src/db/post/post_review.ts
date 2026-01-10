import type { ToInsertType } from "@asla/yoursql";

export type DbPostReviewInfo = {
  type: PostReviewType;
  target_id: number;
  create_time: Date;
  reviewed_time: Date | null;
  reviewer_id: number;
  is_review_pass: boolean | null;
  remark: string | null;
};
export type DbPostReviewInfoCreate = ToInsertType<DbPostReviewInfo, "reviewed_time" | "reviewer_id">;
export enum PostReviewType {
  post = "post",
  postComment = "post_comment",
}
export const enumPostReviewType = new Set([PostReviewType.post, PostReviewType.postComment]);

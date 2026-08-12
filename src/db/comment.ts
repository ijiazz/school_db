import type { ReviewStatus } from "./review.ts";
import type { TextStructure } from "./type.ts";

export enum CommentGroup {
  Post = "post",
  Question = "question",
  Competition = "competition",
}

export type DbCommentTree = {
  id: number;
  comment_total: number;
  group_type: CommentGroup | null;
};

export type DbComment = {
  id: number;
  root_comment_id: number | null;
  parent_comment_id: number | null;
  is_root_reply_count: number;
  reply_count: number;

  comment_tree_id: number;
  user_id: number;

  create_time: Date;
  like_count: number;
  dislike_count: number;
  content_text: string | null;
  content_text_struct: TextStructure[] | null;

  review_status: ReviewStatus | null;
  review_id: number | null;
};

export type DbCommentLike = {
  comment_id: number;
  user_id: number;
  create_time: Date;
  weight: number;
  reason: string | null;
};

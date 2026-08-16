import type { INT } from "@/db/db_type.ts";
import type { ReviewStatus } from "./review.ts";
import type { TextStructure } from "./type.ts";

export enum CommentGroup {
  Post = "post",
  Question = "question",
  Competition = "competition",
}

export type DbCommentTree = {
  id: INT;
  comment_total: INT;
  group_type: CommentGroup | null;
  owner_id: INT | null;
  is_closed: boolean;
};

export type DbComment = {
  id: INT;
  root_comment_id: INT | null;
  parent_comment_id: INT | null;
  is_root_reply_count: INT;
  reply_count: INT;

  comment_tree_id: INT;
  user_id: INT;

  create_time: Date;
  like_count: number;
  dislike_count: number;
  content_text: string | null;
  content_text_struct: TextStructure[] | null;

  review_status: ReviewStatus | null;
  review_id: INT | null;
};

export type DbCommentLike = {
  comment_id: INT;
  user_id: INT;
  create_time: Date;
  weight: number;
  reason: string | null;
};

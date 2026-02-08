import type { ToInsertType } from "@asla/yoursql";
import type { TextStructure } from "../type.ts";

export type DbPostComment = {
  id: number;
  root_comment_id: number | null;
  parent_comment_id: number | null;
  is_root_reply_count: number;
  reply_count: number;
  post_id: number;
  user_id: number;
  create_time: Date;
  is_delete: boolean;
  like_count: number;
  dislike_count: number;
  content_text: string | null;
  content_text_struct: TextStructure | null;

  reviewing_id: number | null;
};
export type DbPostCommentCreate = ToInsertType<
  DbPostComment,
  | "id"
  | "create_time"
  | "is_delete"
  | "dislike_count"
  | "like_count"
  | "is_root_reply_count"
  | "reply_count"
>;

export type DbPostCommentLike = {
  comment_id: number | null;
  user_id: number | null;
  create_time: Date;
  weight: number;
  reason: string | null;
};
export type DbPostCommentLikeCreate = ToInsertType<DbPostCommentLike, "create_time">;

import type { ToInsertType } from "@asla/yoursql";
import type { TextStructure } from "../type.ts";
import type { MediaLevel, MediaType } from "../sys.ts";

export type DbPost = {
  id: number;
  group_id: number | null;
  user_id: number;
  is_delete: boolean;
  is_hide: boolean;
  create_time: Date;
  update_time: Date;
  publish_time: Date | null;
  content_text: string | null;
  content_text_struct: TextStructure | null;
  like_count: number;
  dislike_count: number;
  comment_num: number;
  options: string;
  review_id: number | null;
  reviewing_id: number | null;
};
export type DbPostCreate = Omit<
  ToInsertType<
    DbPost,
    | "is_delete"
    | "is_hide"
    | "create_time"
    | "update_time"
    | "like_count"
    | "dislike_count"
    | "comment_num"
    | "options"
  >,
  "id"
>;

export type DbPostLike = {
  post_id: number;
  user_id: number;
  create_time: Date;
  weight: number;
  reason: string | null;
};
export type DbPostLikeCreate = ToInsertType<DbPostLike, "create_time">;

export type DbPostAsset = {
  post_id: number;
  index: number;
  level: MediaLevel | null;
  type: MediaType;
  filename?: string;
};
export type DbPostAssetCreate = ToInsertType<DbPostAsset>;

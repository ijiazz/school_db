import type { ToInsertType } from "@asla/yoursql";
import type { TextStructure } from "../type.ts";
import type { MediaFileMeta, MediaLevel, MediaType } from "../sys.ts";

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
  content_type: string;
  like_count: number;
  dislike_count: number;
  comment_num: number;
  options: string;
  is_reviewing: boolean;
  is_review_pass: boolean | null;
};
export type DbPostCreate = Omit<
  ToInsertType<
    DbPost,
    | "is_delete"
    | "is_hide"
    | "create_time"
    | "update_time"
    | "content_type"
    | "like_count"
    | "dislike_count"
    | "comment_num"
    | "options"
    | "is_reviewing"
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
  id: number;
  ext: string;
  post_id: number;
  index: number;
  size: number;
  level: MediaLevel | null;
  type: MediaType;
  meta: MediaFileMeta | null;
  hash: string;
  hash_type: string;
};
export type DbPostAssetCreate = ToInsertType<DbPostAsset>;

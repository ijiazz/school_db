import type { CommentExtra, Platform } from "./init.ts";
import type { MediaLevel } from "../sys.ts";

export type DbPlaComment = {
  create_time: Date;
  crawl_check_time: Date;
  reply_last_sync_date: Date | null;
  extra: CommentExtra;
  is_deleted: boolean;
  platform_delete: boolean;
  content_text: string | null;
  content_text_struct: object[] | null;
  comment_type: string;
  pla_uid: string | null;
  publish_time: Date | null;
  ip_location: string | null;
  like_count: number | null;
  reply_count: number | null;
  author_like: boolean | null;
  comment_id: string;
  platform: Platform;
  root_comment_id: string | null;
  parent_comment_id: string | null;
  asset_id: string;
};

export type DbPlaCommentCreate = {
  // create_time?: Date;
  // crawl_check_time?: Date;
  // reply_last_sync_date?: Date | null;
  extra?: CommentExtra;
  // is_deleted: boolean;
  // platform_delete: boolean;

  content_text?: string | null;
  content_text_struct?: object[] | null;
  comment_type: string;
  pla_uid?: string | null;
  publish_time?: Date | null;
  ip_location?: string | null;
  like_count?: number | null;
  reply_count?: number | null;
  author_like?: boolean | null;
  comment_id: string;
  platform: Platform;
  root_comment_id?: string | null;
  parent_comment_id?: string | null;
  asset_id: string;
};

export type DbPlaAssetCommentMedia = {
  platform: Platform;
  comment_id: string;
  index: number;
  level: MediaLevel;
  filename: string | null;
};
export type DbPlaAssetCommentMediaCreate = {
  platform: Platform;
  comment_id: string;
  index: number;
  level: MediaLevel;
  filename?: string | null;
};

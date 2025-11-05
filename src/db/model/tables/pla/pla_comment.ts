import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { CommentExtra } from "../../type.ts";

const TABLE = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  reply_last_sync_date: dbTypeMap.genColumn("TIMESTAMPTZ"),
  extra: dbTypeMap.genColumn<CommentExtra>("JSONB", true, "'{}'"),

  is_deleted: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),
  platform_delete: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),

  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_text_struct: dbTypeMap.genColumn("JSONB"),

  additional_image: dbTypeMap.genColumn("VARCHAR"),
  additional_image_thumb: dbTypeMap.genColumn("VARCHAR"),
  comment_type: dbTypeMap.genColumn("BIT(8)", true, "0::BIT(8)"),
  pla_uid: dbTypeMap.genColumn("VARCHAR"),
  publish_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  like_count: dbTypeMap.genColumn("INTEGER"),
  reply_count: dbTypeMap.genColumn("INTEGER"),
  author_like: dbTypeMap.genColumn("BOOLEAN"),

  comment_id: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  root_comment_id: dbTypeMap.genColumn("VARCHAR"),
  parent_comment_id: dbTypeMap.genColumn("VARCHAR"),
  asset_id: dbTypeMap.genColumn("VARCHAR", true),
} satisfies TableDefined;
const pla_comment_create_key = [
  "author_like",
  "comment_id",
  "content_text",
  "extra",
  "ip_location",
  "like_count",
  "parent_comment_id",
  "pla_uid",
  "platform",
  "publish_time",
  "asset_id",
  "additional_image",
  "additional_image_thumb",
  "root_comment_id",
  "comment_type",
  "reply_count",
] as const;

export type DbPlaComment = InferTableDefined<typeof TABLE>;

export type DbPlaCommentCreate = ToInsertType<
  DbPlaComment,
  "create_time" | "crawl_check_time" | "extra" | "is_deleted" | "platform_delete" | "comment_type"
>;

export const pla_comment = createTable<DbPlaComment, DbPlaCommentCreate>("pla_comment", TABLE);
export const pla_pla_comment_check = pla_comment.createTypeChecker<DbPlaCommentCreate>(pla_comment_create_key);

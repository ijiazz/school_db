import { PickColumn, InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap, sqlValue } from "../_sql_value.ts";
import { PublishedExtra } from "../type.ts";

const pla_publishedDefine = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now"),
  comment_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  comment_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  extra: dbTypeMap.genColumn<PublishedExtra>("JSONB", true, sqlValue({})),

  platform_delete: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),
  is_delete: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),

  publish_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_type: dbTypeMap.genColumn("SMALLINT", true, "0"),
  user_name_snapshot: dbTypeMap.genColumn("VARCHAR"),
  user_avatar_snapshot: dbTypeMap.genColumn("VARCHAR"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  like_count: dbTypeMap.genColumn("INTEGER"),
  collection_num: dbTypeMap.genColumn("INTEGER"),
  forward_num: dbTypeMap.genColumn("INTEGER"),

  cover_uri: dbTypeMap.genColumn("VARCHAR"),
  image_uri: dbTypeMap.genArrColumn("VARCHAR"),
  video_uri: dbTypeMap.genArrColumn("VARCHAR"),
  audio_uri: dbTypeMap.genArrColumn("VARCHAR"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  published_id: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;
export type DbPlaPublished = InferTableDefined<typeof pla_publishedDefine>;

const createRequiredKeys = [
  "collection_num",
  "content_text",
  "forward_num",
  "ip_location",
  "like_count",
  "pla_uid",
  "platform",
  "publish_time",
  "published_id",
  "image_uri",
  "video_uri",
  "audio_uri",
  "cover_uri",
] as const;
const createOptionalKeys = ["extra", "content_type"] as const;

export const pla_published_create_key = [...createRequiredKeys, ...createOptionalKeys] as const;

export const pla_published = createTable<DbPlaPublished, DbPlaPublishedCreate>("pla_published", pla_publishedDefine);

export const pla_published_check = pla_published.createTypeChecker<DbPlaPublishedCreate>(pla_published_create_key);

export type DbPlaPublishedCreate = PickColumn<
  DbPlaPublished,
  (typeof createRequiredKeys)[number],
  (typeof createOptionalKeys)[number]
>;

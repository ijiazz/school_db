import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { AssetExtra } from "../../type.ts";

const pla_assetDefine = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now"),
  comment_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  comment_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  extra: dbTypeMap.genColumn<AssetExtra>("JSONB", true, "'{}'"),

  platform_delete: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),
  is_deleted: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),

  publish_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_text_struct: dbTypeMap.genColumn("JSONB"),
  content_type: dbTypeMap.genColumn("BIT(8)", true, "0::BIT(8)"),
  user_name_snapshot: dbTypeMap.genColumn("VARCHAR"),
  user_avatar_snapshot: dbTypeMap.genColumn("VARCHAR"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  like_count: dbTypeMap.genColumn("INTEGER"),
  comment_num: dbTypeMap.genColumn("INTEGER"),
  collection_num: dbTypeMap.genColumn("INTEGER"),
  forward_num: dbTypeMap.genColumn("INTEGER"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  asset_id: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;
export type DbPlaAsset = InferTableDefined<typeof pla_assetDefine>;

const createRequiredKeys = [
  "collection_num",
  "content_text",
  "forward_num",
  "ip_location",
  "like_count",
  "pla_uid",
  "platform",
  "publish_time",
  "asset_id",
  "content_text_struct",
  "comment_num",
] as const;

export const pla_asset_create_key = [...createRequiredKeys, "extra", "content_type"] as const;

export const pla_asset = createTable<DbPlaAsset, DbPlaAssetCreate>("pla_asset", pla_assetDefine);

export const pla_asset_check = pla_asset.createTypeChecker<DbPlaAssetCreate>(pla_asset_create_key);

export type DbPlaAssetCreate = ToInsertType<
  DbPlaAsset,
  "create_time" | "crawl_check_time" | "extra" | "platform_delete" | "is_deleted" | "content_type"
>;

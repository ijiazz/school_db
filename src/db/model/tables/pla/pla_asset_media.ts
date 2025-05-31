import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { AssetMediaType } from "../../const.ts";

const TABLE = {
  file_id: dbTypeMap.genColumn("VARCHAR", true),
  ext: dbTypeMap.genColumn("VARCHAR"),
  platform: dbTypeMap.genColumn("platform_flag"),
  asset_id: dbTypeMap.genColumn("VARCHAR"),
  index: dbTypeMap.genColumn("SMALLINT", true),

  size: dbTypeMap.genColumn("INT"),
  level: dbTypeMap.genColumn("media_level"),

  type: dbTypeMap.genColumn("media_type", true),
  meta: dbTypeMap.genColumn<Record<string, any>>("JSONB", true),
  hash: dbTypeMap.genColumn("VARCHAR", true),
  hash_type: dbTypeMap.genColumn("VARCHAR", true),
} satisfies TableDefined;

export type DbPlaAssetMedia<Meta = Record<string, any>> = Omit<InferTableDefined<typeof TABLE>, "meta"> & {
  meta: Meta;
};
export type DbPlaAssetMediaCreate<Meta = Record<string, any>> = ToInsertType<DbPlaAssetMedia<Meta>>;

export const pla_asset_media = createTable<DbPlaAssetMedia, DbPlaAssetMediaCreate>("pla_asset_media", TABLE);

const TABLE2 = {
  platform: dbTypeMap.genColumn("platform_flag"),
  asset_id: dbTypeMap.genColumn("VARCHAR"),
  index: dbTypeMap.genColumn("SMALLINT", true),
  type: dbTypeMap.genColumn("media_type", true),
  description: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;
export type DbPlaAssetMediaMissing = InferTableDefined<typeof TABLE2>;
export type DbPlaAssetMediaMissingCreate = ToInsertType<DbPlaAssetMediaMissing>;
export const pla_asset_media_missing = createTable<DbPlaAssetMediaMissing, DbPlaAssetMediaMissingCreate>(
  "pla_asset_media_missing",
  TABLE2,
);

type MediaFileBase<Meta extends {}> = {
  path: string;
  meta: Meta;
  size: number;
};
export type AudioMediaFile = MediaFileBase<AudioFileMeta> & {
  type: AssetMediaType.audio;
};
export type VideoMediaFile = MediaFileBase<VideoFileMeta> & {
  type: AssetMediaType.video;
};
export type ImageMediaFile = MediaFileBase<ImageFileMeta> & {
  type: AssetMediaType.image;
};
export type MediaFile = AudioMediaFile | VideoMediaFile | ImageMediaFile;

export interface ImageFileMeta {
  width: number;
  height: number;
}
export interface VideoFileMeta {
  format?: string;
  width: number;
  height: number;

  fps?: number;

  frame_num?: number;
  bit_rate?: number;
}
export interface AudioFileMeta {
  format?: string;
  duration: number;
}

import { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const file_base = {
  platform: dbTypeMap.genColumn("platform_flag"),
  published_id: dbTypeMap.genColumn("VARCHAR"),
  uri: dbTypeMap.genColumn("VARCHAR", true),
  index: dbTypeMap.genColumn("SMALLINT"),

  size: dbTypeMap.genColumn("INT"),
  level: dbTypeMap.genColumn("media_level"),
} satisfies TableDefined;

const asset_videoDefined = {
  ...file_base,
  format: dbTypeMap.genColumn("VARCHAR"),

  frame_num: dbTypeMap.genColumn("INTEGER"),
  width: dbTypeMap.genColumn("SMALLINT"),
  height: dbTypeMap.genColumn("SMALLINT"),
  fps: dbTypeMap.genColumn("SMALLINT"),
  bit_rate: dbTypeMap.genColumn("INT"),
} satisfies TableDefined;
export type DbAssetVideo = InferTableDefined<typeof asset_videoDefined>;
export type DbAssetVideoCreate = PickColumn<DbAssetVideo>;
export const asset_video = createTable<DbAssetVideo, DbAssetVideoCreate>("asset_video", asset_videoDefined);

const asset_audioDefined = {
  ...file_base,
  format: dbTypeMap.genColumn("VARCHAR"),

  duration: dbTypeMap.genColumn("INTEGER"),
} satisfies TableDefined;
export type DbAssetAudio = InferTableDefined<typeof asset_audioDefined>;
export type DbAssetAudioCreate = PickColumn<DbAssetAudio>;

export const asset_audio = createTable<DbAssetAudio, DbAssetAudioCreate>("asset_audio", asset_videoDefined);

const asset_imageDefined = {
  ...file_base,

  width: dbTypeMap.genColumn("SMALLINT"),
  height: dbTypeMap.genColumn("SMALLINT"),
} satisfies TableDefined;
export type DbAssetImage = InferTableDefined<typeof asset_imageDefined>;
export type DbAssetImageCreate = PickColumn<DbAssetImage>;

export const asset_image = createTable<DbAssetImage, DbAssetImageCreate>("asset_image", asset_imageDefined);

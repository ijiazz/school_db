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

const published_videoDefined = {
  ...file_base,
  format: dbTypeMap.genColumn("VARCHAR"),

  frame_num: dbTypeMap.genColumn("INTEGER"),
  width: dbTypeMap.genColumn("SMALLINT"),
  height: dbTypeMap.genColumn("SMALLINT"),
  fps: dbTypeMap.genColumn("SMALLINT"),
  bit_rate: dbTypeMap.genColumn("INT"),
} satisfies TableDefined;
export type DbPublishedVideo = InferTableDefined<typeof published_videoDefined>;
export type DbPublishedVideoCreate = PickColumn<DbPublishedVideo>;
export const published_video = createTable<DbPublishedVideo, DbPublishedVideoCreate>(
  "published_video",
  published_videoDefined
);

const published_audioDefined = {
  ...file_base,
  format: dbTypeMap.genColumn("VARCHAR"),

  duration: dbTypeMap.genColumn("INTEGER"),
} satisfies TableDefined;
export type DbPublishedAudio = InferTableDefined<typeof published_audioDefined>;
export type DbPublishedAudioCreate = PickColumn<DbPublishedAudio>;

export const published_audio = createTable<DbPublishedAudio, DbPublishedAudioCreate>(
  "published_audio",
  published_videoDefined
);

const published_imageDefined = {
  ...file_base,

  width: dbTypeMap.genColumn("SMALLINT"),
  height: dbTypeMap.genColumn("SMALLINT"),
} satisfies TableDefined;
export type DbPublishedImage = InferTableDefined<typeof published_imageDefined>;
export type DbPublishedImageCreate = PickColumn<DbPublishedImage>;

export const published_image = createTable<DbPublishedImage, DbPublishedImageCreate>(
  "published_image",
  published_imageDefined
);

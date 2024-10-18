import { PickColumn, InferTableDefined, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const file_image_define = {
  uri: dbTypeMap.genColumn("VARCHAR", true),
  ref_count: dbTypeMap.genColumn("INTEGER", true),
  image_width: dbTypeMap.genColumn("SMALLINT"),
  image_height: dbTypeMap.genColumn("SMALLINT"),
} satisfies TableDefined;

export type DbFileImage = InferTableDefined<typeof file_image_define>;
export type DbFileImageCreate = PickColumn<DbFileImage, "image_height" | "image_width" | "uri">;

export const file_image = createTable<DbFileImage, DbFileImageCreate>("file_image", file_image_define);

const file_audio_define = {
  uri: dbTypeMap.genColumn("VARCHAR", true),
  ref_count: dbTypeMap.genColumn("INTEGER", true),
  format: dbTypeMap.genColumn("VARCHAR"),
  duration: dbTypeMap.genColumn("INTEGER"),
} satisfies TableDefined;

export type DbFileAudio = InferTableDefined<typeof file_audio_define>;
export type DbFileAudioCreate = PickColumn<DbFileAudio, "duration" | "format" | "uri">;
export const file_audio = createTable<DbFileAudio, DbFileAudioCreate>("file_audio", file_audio_define);

const file_video_define = {
  ...file_audio_define,
  cover_uri: dbTypeMap.genColumn("VARCHAR"),
  video_width: dbTypeMap.genColumn("SMALLINT"),
  video_height: dbTypeMap.genColumn("SMALLINT"),
  fps: dbTypeMap.genColumn("SMALLINT"),
} satisfies TableDefined;

export type DbFileVideo = InferTableDefined<typeof file_video_define>;
export type DbFileVideoCreate = PickColumn<
  DbFileVideo,
  "cover_uri" | "duration" | "format" | "fps" | "uri" | "video_height" | "video_width"
>;
export const file_video = createTable<DbFileVideo, DbFileVideoCreate>("file_video", file_video_define);

export enum MediaType {
  video = "video",
  audio = "audio",
  image = "image",
}

/** @deprecated 改用 MediaType */
export const AssetMediaType = MediaType;

/** @deprecated 改用 MediaType */
export type AssetMediaType = MediaType;

export const enumAssetMediaType = new Set([MediaType.video, MediaType.audio, MediaType.image]);

export enum MediaLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}
export const enumMediaLevel = new Set([MediaLevel.other, MediaLevel.origin, MediaLevel.thumb]);

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
export type MediaFileMeta = ImageFileMeta | VideoFileMeta | AudioFileMeta;

export type DbSysFile<T extends MediaFileMeta = MediaFileMeta> = {
  bucket: string;
  filename: string;
  size: number;
  create_time: Date;

  hash: string;
  ref_count: number;
  media_type: MediaType;
  meta: T;
};

export type DbSysFileCreate<T extends MediaFileMeta = MediaFileMeta> = {
  bucket: string;
  filename: string;
  size: number;

  hash: string;
  media_type: MediaType;
  meta: T;
};

export type DbSysFileOperation = {
  bucket: string;
  filename: string;
  to_bucket: string | null;
  to_path: string | null;
  time: Date;
};
export type DbSysFileOperationCreate = {
  bucket: string;
  filename: string;
  to_bucket?: string | null;
  to_path?: string | null;
};

const OOS_BUCKETS = {
  /** 用户头像。 名称格式 sha256.suffix*/
  AVATAR: "avatar",
  /** 作品预览图。名称格式 PlatformCode-pid-md5.suffix */
  PUBLISHED_COVER: "video_cover",
  /** 作品视频。 名称格式 PlatformCode-pid-md5.suffix */
  PUBLISHED_VIDEO: "height_video",
  /** 作品图片。 名称格式 PlatformCode-pid-md5.suffix */
  PUBLISHED_IMAGES: "height_images",
  /** 作品音频。 名称格式 PlatformCode-pid-md5.suffix */
  PUBLISHED_AUDIO: "heigh_audio",
  /** 评论区图片 名称格式  sha256.suffix */
  COMMENT_IMAGE: "comment_img",
} as const;
type OosBucket = typeof OOS_BUCKETS;

/** @public */
export function getAllBuckets(): string[] {
  return Object.values(OOS_BUCKETS);
}

/** @public */
export function getBucket(): OosBucket {
  return OOS_BUCKETS;
}
/** @public */
export const OBJECT_NAME_REGEXP = /(md5|sha1|sha256)_[0-9a-f]+.[^.]*$/;

/** @public */
export interface FileObjectMeta {
  flag?: string;
  filename: string;
  ext: string;
  hashHex: string;
  hashAlgorithm: "md5" | "sha1" | "sha256";
}
/** @public */
export function getOosBlobName(meta: Omit<FileObjectMeta, "filename">) {
  let name = meta.hashAlgorithm + "_" + meta.hashHex + "." + meta.ext;
  if (meta.flag) name = meta.flag + "-" + name;
  return name;
}

const OSS_BUCKETS = {
  /** 用户头像。 名称格式 sha256.suffix*/
  AVATAR: "avatar",
  /** 帖子媒体资源 名称格式 `${platform}-${asset_id}-${index}-${media_level}.${ext}` */
  PLA_POST_MEDIA: "pla_post_media",
  /** 评论区图片 名称格式  sha256.suffix */
  COMMENT_IMAGE: "comment_img",
  /** 表情包 名称格式  sha256.suffix */
  EMOTION: "emotion",
  /** 验证码图片 */
  CAPTCHA_PICTURE: "captcha_picture",
} as const;
type OssBucket = typeof OSS_BUCKETS;

/** @public */
export function getAllBuckets(): string[] {
  return Object.values(OSS_BUCKETS);
}

/** @public */
export function getBucket(): OssBucket {
  return OSS_BUCKETS;
}
/** @public */
export const FILE_HASH_NAME_REGEXP = /(md5|sha1|sha256)_[0-9a-f]+.[^.]*$/;

/** @public */
export interface FileObjectMeta {
  /** ext 不包含 .” */
  ext?: string;
  hashHex: string;
  hashAlgorithm: "md5" | "sha1" | "sha256";
}
/**
 * hashAlgorithm_hashHex.ext
 * @public
 */
export function getFileHashName(meta: FileObjectMeta) {
  if (/md5|sha1|sha256/.test(meta.hashAlgorithm) === false) {
    throw new Error(`Unsupported hash algorithm: ${meta.hashAlgorithm}`);
  }
  return meta.hashAlgorithm + "_" + meta.hashHex + (meta.ext ? "." + meta.ext : "");
}

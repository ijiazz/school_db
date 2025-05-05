const OSS_BUCKETS = {
  /** 用户头像。 名称格式 sha256.suffix*/
  AVATAR: "avatar",
  /** 评论区图片 名称格式 `${file_id}.${ext}` */
  PLA_POST_MEDIA: "pla_post_media",
  /** 评论区图片 名称格式  sha256.suffix */
  COMMENT_IMAGE: "comment_img",
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
export const OBJECT_NAME_REGEXP = /(md5|sha1|sha256)_[0-9a-f]+.[^.]*$/;

/** @public */
export interface FileObjectMeta {
  flag?: string;
  filename: string;
  ext: string;
  hashHex: string;
  hashAlgorithm: "md5" | "sha1" | "sha256";
}
/**
 * flag-hashAlgorithm_hashHex.ext
 * @public
 */
export function getOssBlobName(meta: Omit<FileObjectMeta, "filename">) {
  let name = meta.hashAlgorithm + "_" + meta.hashHex + "." + meta.ext;
  if (meta.flag) name = meta.flag + "-" + name;
  return name;
}

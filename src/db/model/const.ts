export enum Platform {
  /** 抖音 */
  douYin = "douyin",
  /** bilibili */
  bilibili = "bilibili",
  /** 小红书 */
  xiaoHongShu = "xiaohonshu",
  /** 微博 */
  weibo = "weibo",
  /** 5Sing 音乐 */
  v5sing = "v5sing",
  /** 网易云音乐 */
  wangYiMusic = "wangyiyun",
}
export const PLATFORM_CODE_MAP: Record<Platform, number> = {
  [Platform.douYin]: 1,
  [Platform.bilibili]: 2,
  [Platform.xiaoHongShu]: 3,
  [Platform.weibo]: 4,
  [Platform.v5sing]: 5,
  [Platform.wangYiMusic]: 6,
};

export enum CrawlTaskStatus {
  waiting = "waiting",
  processing = "processing",
  success = "success",
  failed = "failed",
  hide = "hide",
}
export type CrawlTaskResultStatus = CrawlTaskStatus.failed | CrawlTaskStatus.success | CrawlTaskStatus.waiting;

export const USER_LEVEL = {
  god: 32700,
  first: 32600,
  second: 32500,
  tourists: 0,
} as const;
export function getLevel(level: number): keyof typeof USER_LEVEL {
  if (level >= USER_LEVEL.god) return "god";
  else if (level >= USER_LEVEL.first) return "first";
  else if (level >= USER_LEVEL.second) return "second";
  return "tourists";
}
export const enumPlatform = new Set([
  Platform.douYin,
  Platform.bilibili,
  Platform.v5sing,
  Platform.wangYiMusic,
  Platform.weibo,
  Platform.xiaoHongShu,
]);

export enum TaskType {
  syncUserProfile = "syncUserProfile",
  syncAssetList = "syncAssetList",
  syncAssetComment = "syncAssetComment",
  syncCommentReply = "syncCommentReply",
  saveAsset = "saveAsset",
}
export const enumTaskType = new Set([
  TaskType.syncAssetList,
  TaskType.syncAssetComment,
  TaskType.saveAsset,
  TaskType.syncUserProfile,
  TaskType.syncCommentReply,
]);

export function getResourceTypeNumber(meta: { text?: boolean; video?: boolean; audio?: boolean; image?: boolean }) {
  let number = 0;
  if (meta.video) number |= 0b1000;
  if (meta.audio) number |= 0b0100;
  if (meta.image) number |= 0b0010;
  if (meta.text) number |= 0b0001;
  return number;
}
export function getResourceTypeBit(meta: Parameters<typeof getResourceTypeNumber>[0]): string {
  const num = getResourceTypeNumber(meta);
  let bitType = num.toString(2);
  return "0".repeat(8 - bitType.length) + bitType;
}

export enum AssetMediaType {
  video = "video",
  audio = "audio",
  image = "image",
}
export const enumAssetMediaType = new Set([AssetMediaType.video, AssetMediaType.audio, AssetMediaType.image]);

export enum MediaLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}
export const enumMediaLevel = new Set([MediaLevel.other, MediaLevel.origin, MediaLevel.thumb]);

/**
 * 公共班级根节点ID，（见SQL文件初始班级数据语句）
 */
export const PUBLIC_CLASS_ROOT_ID = -1;

export enum LogLevel {
  log = "log",
  info = "info",
  warn = "warn",
  error = "error",
}

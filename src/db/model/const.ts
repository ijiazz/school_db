export enum CrawlTaskStatus {
  waiting = "waiting",
  processing = "processing",
  success = "success",
  failed = "failed",
  hide = "hide",
}
export type CrawlTaskResultStatus = CrawlTaskStatus.failed | CrawlTaskStatus.success | CrawlTaskStatus.waiting;

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

/**
 * 公共班级根节点ID，（见SQL文件初始班级数据语句）
 */
export const PUBLIC_CLASS_ROOT_ID = -1;

export enum PostReviewType {
  post = "post",
  postComment = "post_comment",
}
export const enumPostReviewType = new Set([PostReviewType.post, PostReviewType.postComment]);

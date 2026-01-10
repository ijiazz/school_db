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

export const enumPlatform = new Set([
  Platform.douYin,
  Platform.bilibili,
  Platform.v5sing,
  Platform.wangYiMusic,
  Platform.weibo,
  Platform.xiaoHongShu,
]);
export type UserExtra = { [key: string]: any };
export type AssetExtra = { [key: string]: any };
export type CommentExtra = {
  [key: string]: any;
};

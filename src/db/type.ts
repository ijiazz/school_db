type TextStructureBase = {
  /** 字符串索引 */
  index: number;
  /** 基于索引的偏移量 */
  length: number;
};

export type TextStructure =
  | TextStructureExternalLink
  | TextStructureUser
  | (TextStructureBase & { type: TextStructureType.unknown; [key: string]: unknown });

export type TextStructureExternalLink = TextStructureBase & {
  type: TextStructureType.link;
  link: string;
};
export type TextStructureUser = TextStructureBase & {
  type: TextStructureType.user;
  user_id: string;
};
export enum TextStructureType {
  unknown = -1,
  /** 外部链接 */
  link = 0,
  /** 平台用户 */
  user = 1,
  /** 话题 */
  topic = 2,
}
/** 数据库中保存媒体的特殊索引 */
export enum AssetMediaIndex {
  cover = 0,
  bgAudio = -1,
}

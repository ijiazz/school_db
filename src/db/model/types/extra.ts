export type UserExtra = { [key: string]: any };
export type PublishedExtra = { [key: string]: any };
export type CommentExtra = {
  /** 评论回复数量，用于判断是否需要同步回复 */
  reply_count?: number;
  [key: string]: any;
};

export namespace DouYin {
  /** 抖音 pla_user extra 字段 的 json 类型 */
  export interface UserExtra {
    sec_uid: string;
    cover_uri?: string;
  }
  export interface PublishedExtra {}
  export interface CommentExtra {
    /** 评论回复数量，用于判断是否需要同步回复 */
    reply_count?: number;
  }

  export interface TitleLinkUser extends TextStructure {
    type: TextStructureType.user;
    /** 签名uid */
    sec_uid: string;
    user_id: number;
  }
  export interface TitleLinkSubject extends TextStructure {
    type: TextStructureType.topic;
    /** 标签名称 */
    hashtag_name: string;
    /** 标签id */
    hashtag_id: string;
    is_commerce: false;
  }
  export type TitleLink = TitleLinkUser | TitleLinkSubject;
}

export interface TextStructure {
  /** 字符串索引 */
  index: number;
  /** 基于索引的偏移量 */
  length: number;
  /** 0: 平台用户。 */
  type?: TextStructureType;
  [key: string]: any;
}
export type TextStructureExternalLink = TextStructure & {
  link: string;
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

export type UserExtra = DouYin.UserExtra | {};
export type PublishedExtra = DouYin.PublishedExtra | {};
export type CommentExtra = DouYin.CommentExtra | {};

export namespace DouYin {
  /** 抖音 pla_user extra 字段 的 json 类型 */
  export interface UserExtra extends UserExtraBase {
    sec_uid: string;
    signature_extra?: TitleLink[];
    cover_uri?: string;
  }
  export interface PublishedExtra {
    /** 文本中的话题、@ 高亮与转跳 */
    text_extra?: TitleLink[];
  }
  export interface CommentExtra {
    /** 文本中的话题、@ 高亮与转跳 */
    text_extra?: TitleLink[];
    /** 评论回复数量，用于判断是否需要同步回复 */
    reply_count?: number;
  }

  /**
   * @deprecated 改用 TextStructure
   * TODO 统一处理为TextStructure
   */
  interface TitleLinkBase {
    /** 字符开始*/
    start: number;
    /** 字符串结尾 */
    end: number;
    type: number;
  }

  export interface TitleLinkUser extends TitleLinkBase {
    /** 签名uid */
    sec_uid: string;
    user_id: number;
    type: 0;
  }
  export interface TitleLinkSubject extends TitleLinkBase {
    /** 标签名称 */
    hashtag_name: string;
    /** 标签id */
    hashtag_id: string;
    is_commerce: false;
  }
  export type TitleLink = TitleLinkUser | TitleLinkSubject;
}
interface UserExtraBase {
  /** 粉丝数量 */
  follower_count?: number;
  /** 关注数量 */
  following_count?: number;
  /** 用户签名 */
  signature?: string;
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
  /** 外部链接 */
  link = 0,
  /** 平台用户 */
  user = 1,
  /** 话题 */
  topic = 2,
}

export type UserExtra = DouYin.UserExtra;
export type PublishedExtra = DouYin.PublishedExtra;
export type CommentExtra = DouYin.CommentExtra;

export interface ImageAddr {
  height: number;
  width: number;
  uri: string; // "aweme-avatar/tos-cn-avt-0015_7bb1aa99995665e1f73f90e46e706487"
  url_list: string[]; //["https://p3-pc.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_7bb1aa99995665e1f73f90e46e706487.jpeg?from=2956013662"]
}
export interface VideoSelectItem {
  width: number;
  height: number;
  uri: string;
  url_list: string[];
  data_size: number;
  file_hash: string;
  bitrate?: number;
  type: "h264" | "h265";
}
export namespace DouYin {
  /** 抖音 pla_user extra 字段 的 json 类型 */
  export interface UserExtra extends UserExtraBase {
    sec_uid: string;
    signature_extra?: TitleLink[];
    cover_uri?: string;
  }
  export interface PublishedExtra {
    content?: {
      duration?: number;
      type: number;
      cover_uri?: ImageAddr;
      image_uri?: ImageAddr[];
      audio_uri?: unknown;
      video_uri?: VideoSelectItem[];
    };
    /** 文本中的话题、@ 高亮与转跳 */
    text_extra?: TitleLink[];
  }
  export interface CommentExtra {
    /** 文本中的话题、@ 高亮与转跳 */
    text_extra?: TitleLink[];
    /** 评论回复数量，用于判断是否需要同步回复 */
    reply_count?: number;
  }
}
interface UserExtraBase {
  /** 粉丝数量 */
  follower_count?: number;
  /** 关注数量 */
  following_count?: number;
  /** 用户签名 */
  signature?: string;
}

export interface TitleLinkBase {
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

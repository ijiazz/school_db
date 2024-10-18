/** 系统资源URL类型 */
export interface ResourceUrlInfo {
  res_url_list: (ImageUrlInfo | AudioUrlInfo | VideoUrlInfo)[];
}

export interface ResourceUrlBase {
  path: string;
}
export interface ImageUrlInfo extends ResourceUrlBase {
  type: "image";
  width: number;
  height: number;
}
export interface AudioUrlInfo extends ResourceUrlBase {
  type: "audio";
  /** 时长 */
  duration: number;
  /** 封面背景 */
  cover?: ImageUrlInfo;
}
export interface VideoUrlInfo extends ResourceUrlBase {
  type: "video";
  width: number;
  height: number;
  /** 时长 */
  duration: number;
  /** 封面背景 */
  cover?: ImageUrlInfo;
}

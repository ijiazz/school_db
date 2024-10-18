export type SyncUserProfileTask<E = any> = {
  uid: string;
  /** 平台的头像 uri , 用于判断头像是否变化 */
  avatarUri: string | null;
  extra: E;
};

export type SyncPublishedListTask<E = any> = {
  uid: string;
  /** 只读取统计信息 */
  statOnly?: boolean;
  afterDate?: Date;
  extra: E;
};

export type SavePublishedTask<E = any> = { pid: string; extra: E };

export type SyncPublishedCommentTask<E = any> = { pid: string; ignoreReply?: boolean; afterDate?: Date; extra: E };
export type SyncCommentReplyTask<E = any> = { pid: string; cid: string; afterDate?: Date; extra: E };

export type CrawlTaskData = SyncUserProfileTask | SyncPublishedListTask | SyncPublishedCommentTask | SavePublishedTask;

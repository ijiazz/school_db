import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { TaskType } from "../../const.ts";
import type { MediaLevel } from "../../sys/file.ts";

const TABLE = {
  task_id: dbTypeMap.genColumn("SERIAL", true),
  name: dbTypeMap.genColumn<TaskType>("VARCHAR", true),
  creator: dbTypeMap.genColumn("VARCHAR"),
  level: dbTypeMap.genColumn("SMALLINT", true, "0"),
  platform: dbTypeMap.genColumn("platform_flag", true),
  args: dbTypeMap.genColumn<CrawlTaskData>("JSONB", true),
  result: dbTypeMap.genColumn("JSONB"),
  errors: dbTypeMap.genColumn("JSONB"),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  exec_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  status: dbTypeMap.genColumn("crawl_task_status", true, "'waiting'"),
} satisfies TableDefined;

export type DbCrawlerTaskQueue = InferTableDefined<typeof TABLE>;

const priority_queue_columns = ["task_id", "platform", "args", "create_time", "name", "level", "creator"] as const;

export type DbCrawlerTaskPriorityQueue = Pick<DbCrawlerTaskQueue, (typeof priority_queue_columns)[number]>;

export type DbCrawlerTaskQueueCreate = Omit<
  ToInsertType<DbCrawlerTaskQueue, "level" | "create_time" | "last_update_time" | "status">,
  "task_id"
>;

const priority = {
  task_id: TABLE.task_id,
  platform: TABLE.platform,
  args: TABLE.args,
  create_time: TABLE.create_time,
  name: TABLE.name,
  level: TABLE.level,
  creator: TABLE.creator,
} as const;

export const crawl_task_queue = createTable<DbCrawlerTaskQueue, DbCrawlerTaskQueueCreate>("crawl_task_queue", TABLE);
export const crawl_task_priority_queue = createTable<DbCrawlerTaskPriorityQueue, {}>(
  "crawl_task_priority_queue",
  priority,
);

export type SyncUserProfileTask<E = any> = {
  uid: string;
  /** 平台的头像 uri , 用于判断头像是否变化 */
  avatarUri?: string | null;
  extra: E;
};

export type SyncAssetListTask<E = any> = {
  uid: string;
  /** 只读取统计信息。默认情况下获取到作品数据后，如果作品存在资源，会立即添加同步资源的任务 */
  statOnly?: boolean;
  /** 只获取指定日期之后的作品 */
  afterDate?: Date;
  extra: E;
};

export type SaveAssetTask<E = any> = {
  pid: string;
  extra: E;
  ignoreVideo?: boolean;
  ignoreAudio?: boolean;
  ignoreImage?: boolean;
  ignoreCover?: boolean;
};
export type SyncAssetCommentCommon<E = any> = {
  /** 所属用户id  */
  uid: string;
  /** 作品 id */
  pid: string;

  /** 评论图像保存等级。默认为 [MediaLevel.origin,MediaLevel.thumb] */
  commentImage?: MediaLevel[];
  /** 只获取指定日期之后的评论 */
  afterDate?: Date;
  extra: E;
};
export type SyncAssetCommentTask<E = any> = SyncAssetCommentCommon<E> & {
  /** 是否忽略评论回复，默认情况下，如果为热门评论（作者赞过或回复过，或者点赞数达到指定值） 则为false, 否则为 true */
  ignoreReply?: boolean;
};
export type SyncCommentReplyTask<E = any> = SyncAssetCommentCommon<E> & {
  /** 根评论 id */
  cid: string;
};

export type CrawlTaskData = {
  [key: string]: unknown;
};

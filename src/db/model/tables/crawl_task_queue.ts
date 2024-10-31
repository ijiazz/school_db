import { DbTableQuery, PickColumn, InferTableDefined, TableDefined } from "@asla/yoursql";
import { sqlValue, dbTypeMap, createTable } from "../_sql_value.ts";
import { TaskType } from "../tables.ts";
import { CrawlTaskData } from "../types/task.ts";

const crawl_task_queueDefine = {
  task_id: dbTypeMap.genColumn("SERIAL", true),
  name: dbTypeMap.genColumn<TaskType>("VARCHAR", true),
  creator: dbTypeMap.genColumn("VARCHAR", true),
  level: dbTypeMap.genColumn("SMALLINT", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  args: dbTypeMap.genColumn<CrawlTaskData>("JSONB", true),
  result: dbTypeMap.genColumn("JSONB"),
  errors: dbTypeMap.genColumn("JSONB"),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true),
  exec_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ", true),
  status: dbTypeMap.genColumn("crawl_task_status", true),
} satisfies TableDefined;

export type DbCrawlerTaskQueue = InferTableDefined<typeof crawl_task_queueDefine>;

const priority_queue_columns = ["task_id", "platform", "args", "create_time", "name", "level", "creator"] as const;

export type DbCrawlerTaskPriorityQueue = Pick<DbCrawlerTaskQueue, (typeof priority_queue_columns)[number]>;

export type DbCrawlerTaskQueueCreate = PickColumn<
  DbCrawlerTaskQueue,
  "platform" | "args" | "name",
  "level" | "creator"
>;

export const crawl_task_queue = createTable<DbCrawlerTaskQueue, DbCrawlerTaskQueueCreate>(
  "crawl_task_queue",
  crawl_task_queueDefine
);
export const crawl_task_priority_queue = new DbTableQuery<DbCrawlerTaskPriorityQueue, {}>(
  "crawl_task_priority_queue",
  priority_queue_columns,
  sqlValue
);

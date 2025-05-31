import { DbTableQuery, InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { TaskType } from "../../const.ts";
import type { CrawlTaskData } from "../../types/task.ts";
import v from "../../../../yoursql.ts";

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

export const crawl_task_queue = createTable<DbCrawlerTaskQueue, DbCrawlerTaskQueueCreate>(
  "crawl_task_queue",
  TABLE,
);
export const crawl_task_priority_queue = new DbTableQuery<DbCrawlerTaskPriorityQueue, {}>(
  "crawl_task_priority_queue",
  v,
);

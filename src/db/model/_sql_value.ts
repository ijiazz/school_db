import {
  CustomDbType,
  pgSqlTransformer,
  SqlValuesCreator,
  TableDefined,
  TableType,
  YourTable,
  YourTypeMap,
} from "@asla/yoursql";
import { CrawlTaskStatus, enumMediaLevel, enumPlatform, enumTaskType, MediaLevel, Platform } from "./tables.ts";

export const v = SqlValuesCreator.create(pgSqlTransformer);

export const dbTypeMap = YourTypeMap.create({
  TIMESTAMPTZ: Date,
  TIMESTAMP: Date,
  BOOLEAN: CustomDbType.boolean,
  BIGINT: CustomDbType.bigint,
  INTEGER: CustomDbType.number,
  INT: CustomDbType.number,
  SMALLINT: CustomDbType.number,
  SERIAL: CustomDbType.number,
  VARCHAR: CustomDbType.string,
  CHAR: CustomDbType.string,
  JSON: Object,
  JSONB: Object,
  "BIT(8)": CustomDbType.string,

  media_level: new CustomDbType<MediaLevel>((v) => enumMediaLevel.has(v), "media_level"),
  platform_flag: new CustomDbType<Platform>((v) => enumPlatform.has(v), "platform_flag"),
  crawl_task_status: new CustomDbType<CrawlTaskStatus>((v) => enumTaskType.has(v), "crawl_task_status"),
});

export function createTable<T extends TableType = TableType, C extends TableType = T>(
  name: string,
  define: TableDefined,
): YourTable<T, C> {
  return new YourTable(name, define, v);
}

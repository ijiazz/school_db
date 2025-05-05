import { CustomDbType, TableDefined, TableType, YourTable, YourTypeMap } from "@asla/yoursql";
import {
  AssetMediaType,
  CrawlTaskStatus,
  enumAssetMediaType,
  enumMediaLevel,
  enumPlatform,
  enumTaskType,
  MediaLevel,
  Platform,
} from "./const.ts";
import { v } from "../../yoursql.ts";

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
  media_type: new CustomDbType<AssetMediaType>((v) => enumAssetMediaType.has(v), "media_type"),
  platform_flag: new CustomDbType<Platform>((v) => enumPlatform.has(v), "platform_flag"),
  crawl_task_status: new CustomDbType<CrawlTaskStatus>((v) => enumTaskType.has(v), "crawl_task_status"),
});

export function createTable<T extends TableType = TableType, C extends TableType = T>(
  name: string,
  define: TableDefined,
): YourTable<T, C> {
  return new YourTable(name, define, v);
}

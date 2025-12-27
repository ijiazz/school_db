import { CustomDbType, TableDefined, TableType, YourTable, YourTypeMap } from "@asla/yoursql";
import { CrawlTaskStatus, enumPostReviewType, enumTaskType, PostReviewType } from "./const.ts";
import { enumAssetMediaType, enumMediaLevel, MediaLevel, MediaType } from "./sys.ts";
import { enumPlatform, Platform } from "./tables/pla/init.ts";

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
  media_type: new CustomDbType<MediaType>((v) => enumAssetMediaType.has(v), "media_type"),
  platform_flag: new CustomDbType<Platform>((v) => enumPlatform.has(v), "platform_flag"),
  crawl_task_status: new CustomDbType<CrawlTaskStatus>((v) => enumTaskType.has(v), "crawl_task_status"),
  post_review_type: new CustomDbType<PostReviewType>((v) => enumPostReviewType.has(v), "post_review_type"),
});

export function createTable<T extends TableType = TableType, C = any>(
  name: string,
  define: TableDefined,
): YourTable<T> {
  return new YourTable(name, define);
}

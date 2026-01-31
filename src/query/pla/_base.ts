import { CustomDbType, ObjectToValueKeys, YourTable, YourTypeMap } from "@asla/yoursql";
import {
  CrawlTaskStatus,
  enumAssetMediaType,
  enumMediaLevel,
  enumPlatform,
  enumTaskType,
  MediaLevel,
  MediaType,
  Platform,
} from "@ijia/data/db";

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
});
export function getTableRawMeta(table: YourTable<any>, keys: readonly string[]) {
  let types: ObjectToValueKeys<object> = {};
  for (const k of keys) {
    const meta = table.getColumnMeta(k);
    types[k] = {
      assertJsType: meta.sqlType.includes("JSON") ? Object : undefined, // JSON 类型需要特殊处理,避免 Array 会被转为 ARRAY []. 如 content_text_struct 字段
    };
  }
  return types;
}

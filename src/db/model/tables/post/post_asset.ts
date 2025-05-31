import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  id: dbTypeMap.genColumn("SERIAL", true),
  ext: dbTypeMap.genColumn("VARCHAR", true),
  post_id: dbTypeMap.genColumn("INT", true),
  index: dbTypeMap.genColumn("INT", true),
  size: dbTypeMap.genColumn("INT", true),
  level: dbTypeMap.genColumn("media_level"),
  type: dbTypeMap.genColumn("media_type", true),
  meta: dbTypeMap.genColumn("JSONB"),
  hash: dbTypeMap.genColumn("VARCHAR", true),
  hash_type: dbTypeMap.genColumn("VARCHAR", true),
} satisfies TableDefined;
export type DbPostAsset = InferTableDefined<typeof DEFINE>;
export type DbPostAssetCreate = ToInsertType<DbPostAsset>;
export const post_asset = createTable<DbPostAsset, DbPostAssetCreate>("post_asset", DEFINE);

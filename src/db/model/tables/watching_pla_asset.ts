import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";
const DEFINE = {
  comment_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  comment_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  disabled: dbTypeMap.genColumn("BOOLEAN"),
  asset_id: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;

const CREATE_KEYS = Object.keys(DEFINE);

export type DbWatchingPlaAsset = InferTableDefined<typeof DEFINE>;
export type DbWatchingPlaAssetCreate = PickColumn<DbWatchingPlaAsset, keyof typeof DEFINE>;

export const watching_pla_asset = createTable<DbWatchingPlaAsset, DbWatchingPlaAssetCreate>(
  "watching_pla_asset",
  DEFINE,
);

export const watching_pla_asset_check = watching_pla_asset.createTypeChecker<DbWatchingPlaAssetCreate>(
  CREATE_KEYS,
);

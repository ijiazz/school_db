import type { ToInsertType } from "@asla/yoursql";
import type { Platform } from "./init.ts";

export type DbWatchingPlaAsset = {
  comment_last_full_update_time: Date | null;
  comment_last_update_time: Date | null;
  disabled: boolean | null;
  asset_id: string;
  platform: Platform;
};
export type DbWatchingPlaAssetCreate = ToInsertType<DbWatchingPlaAsset>;

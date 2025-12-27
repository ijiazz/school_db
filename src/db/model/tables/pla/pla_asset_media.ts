import type { MediaLevel } from "../../sys/file.ts";
import type { Platform } from "./init.ts";

export type DbPlaAssetMedia = {
  platform: Platform;
  asset_id: string;
  index: number;
  level: MediaLevel;
  filename?: string;
};
export type DbPlaAssetMediaCreate = DbPlaAssetMedia;

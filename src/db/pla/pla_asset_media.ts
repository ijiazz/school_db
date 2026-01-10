import type { MediaLevel, MediaType } from "../sys.ts";
import type { Platform } from "./init.ts";

export type DbPlaAssetMedia = {
  platform: Platform;
  asset_id: string;
  index: number;
  level: MediaLevel;
  filename?: string;
  media_type?: MediaType;
};
export type DbPlaAssetMediaCreate = DbPlaAssetMedia;

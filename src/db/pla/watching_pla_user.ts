import type { ToInsertType } from "@asla/yoursql";
import type { Platform } from "./init.ts";

export type DbWatchingPlaUser = {
  published_last_full_update_time: Date | null;
  published_last_update_time: Date | null;
  level: number | null;
  visible_time_second: number | null;
  pla_uid: string;
  platform: Platform;
};
export type DbWatchingPlaUserCreate = ToInsertType<DbWatchingPlaUser>;

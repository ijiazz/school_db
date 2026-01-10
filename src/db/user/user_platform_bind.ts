import type { ToInsertType } from "@asla/yoursql";
import type { Platform } from "../pla.ts";

export type DbUserPlatformBind = {
  user_id: number;
  platform: Platform;
  pla_uid: string;
  create_time: Date;
  is_primary: boolean | null;
};
export type DbUserPlatformBindCreate = ToInsertType<DbUserPlatformBind, "create_time">;

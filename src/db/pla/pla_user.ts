import type { ToInsertType } from "@asla/yoursql";
import type { Platform, UserExtra } from "./init.ts";
import type { TextStructure } from "../type.ts";

export const USER_LEVEL = {
  god: 32700,
  first: 32600,
  second: 32500,
  tourists: 0,
} as const;
export function getLevel(level: number): keyof typeof USER_LEVEL {
  if (level >= USER_LEVEL.god) return "god";
  else if (level >= USER_LEVEL.first) return "first";
  else if (level >= USER_LEVEL.second) return "second";
  return "tourists";
}
export type DbPlaUser = {
  create_time: Date;
  crawl_check_time: Date;
  extra: UserExtra;
  pla_avatar_uri: string | null;
  user_name: string | null;
  ip_location: string | null;
  avatar: string | null;
  pla_uid: string;
  platform: Platform;
  follower_count: number | null;
  following_count: number | null;
  signature: string | null;
  signature_struct: TextStructure[] | null;
};
export type DbPlaUserCreate = ToInsertType<DbPlaUser, "create_time" | "crawl_check_time" | "extra">;

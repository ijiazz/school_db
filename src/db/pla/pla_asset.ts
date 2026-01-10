import type { ToInsertType } from "@asla/yoursql";
import type { AssetExtra, Platform } from "./init.ts";
import type { TextStructure } from "../type.ts";

export function getResourceTypeNumber(meta: { text?: boolean; video?: boolean; audio?: boolean; image?: boolean }) {
  let number = 0;
  if (meta.video) number |= 0b1000;
  if (meta.audio) number |= 0b0100;
  if (meta.image) number |= 0b0010;
  if (meta.text) number |= 0b0001;
  return number;
}
export function getResourceTypeBit(meta: Parameters<typeof getResourceTypeNumber>[0]): string {
  const num = getResourceTypeNumber(meta);
  let bitType = num.toString(2);
  return "0".repeat(8 - bitType.length) + bitType;
}

export type DbPlaAsset = {
  create_time: Date;
  crawl_check_time: Date;
  comment_last_full_update_time: Date | null;
  comment_last_update_time: Date | null;
  extra: AssetExtra;
  platform_delete: boolean;
  is_deleted: boolean;
  publish_time: Date | null;
  content_text: string | null;
  content_text_struct: TextStructure[] | null;
  content_type: string;
  ip_location: string | null;
  like_count: number | null;
  comment_num: number | null;
  collection_num: number | null;
  forward_num: number | null;
  pla_uid: string;
  asset_id: string;
  platform: Platform;
};

export type DbPlaAssetCreate = ToInsertType<
  Omit<
    DbPlaAsset,
    | "comment_last_full_update_time"
    | "comment_last_update_time"
    | "crawl_check_time"
  >,
  | "create_time"
  | "extra"
  | "platform_delete"
  | "is_deleted"
  | "content_type"
>;

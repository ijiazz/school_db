import type { ToInsertType } from "@asla/yoursql";

export type DbCommentImage = {
  id: string;
  size: number | null;
  image_width: number | null;
  image_height: number | null;
  ref_count: number;
};
export type DbDbCommentImageCreate = ToInsertType<DbCommentImage, "ref_count">;

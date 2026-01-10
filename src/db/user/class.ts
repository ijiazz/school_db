import type { ToInsertType } from "@asla/yoursql";

export type DbClass = {
  id: number;
  class_name: string | null;
  description: string | null;
  parent_class_id: number | null;
};
export type DbClassCreate = Omit<ToInsertType<DbClass>, "id">;
/**
 * 公共班级根节点ID，（见SQL文件初始班级数据语句）
 */
export const PUBLIC_CLASS_ROOT_ID = -1;

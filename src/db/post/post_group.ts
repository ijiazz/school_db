import type { ToInsertType } from "@asla/yoursql";

export type DbPostGroup = {
  id: number;
  name: string | null;
  description: string | null;
  public_sort: number | null;
};
export type DbPostGroupCreate = Omit<ToInsertType<DbPostGroup>, "id">;

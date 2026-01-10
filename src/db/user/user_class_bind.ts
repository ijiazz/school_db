import type { ToInsertType } from "@asla/yoursql";

export type DbUserClassBind = {
  user_id: number;
  class_id: number;
  create_time: Date;
};
export type DbUserClassBindCreate = ToInsertType<DbUserClassBind, "create_time">;

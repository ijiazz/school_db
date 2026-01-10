import type { ToInsertType } from "@asla/yoursql";

export type DbUser = {
  id: number;
  nickname: string | null;
  avatar: string | null;
  email: string;
  password: string | null;
  pwd_salt: string | null;
  is_deleted: boolean;
  create_time: Date;
  last_login_time: Date;
};
export type DbUserCreate = Omit<
  ToInsertType<DbUser, "id" | "is_deleted">,
  "create_time" | "last_login_time"
>;
export type DbUserBlackList = {
  user_id: number;
  create_time: Date;
  reason: string | null;
};
export type DbUserBlackListCreate = ToInsertType<DbUserBlackList, "create_time">;

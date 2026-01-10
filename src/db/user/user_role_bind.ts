import type { ToInsertType } from "@asla/yoursql";

export type DbUserRoleBind = {
  user_id: number;
  role_id: string;
};
export type DbUserRoleBindCreate = ToInsertType<DbUserRoleBind>;

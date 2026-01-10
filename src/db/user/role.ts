import type { ToInsertType } from "@asla/yoursql";

export type DbRole = {
  id: string;
  role_name: string | null;
  description: string | null;
};
export type DbRoleCreate = ToInsertType<DbRole>;

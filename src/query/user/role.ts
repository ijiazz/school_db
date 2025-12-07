import { v } from "@asla/yoursql";
import { role, user_role_bind } from "@ijia/data/db";
import { deleteFrom } from "@asla/yoursql";
import { dbPool, ExecutableSQL } from "@ijia/data/dbclient";
import { insertIntoValues } from "../../common/sql.ts";

export type Role = {
  id: string;
  description?: string;
  roleName: string;
};
export function createRole(roleData: Role): ExecutableSQL<void> {
  return dbPool.createExecutableSQL(insertIntoValues(role.name, roleData).returning("id"));
}

export function addRoleToUser(userId: number, roleId: string): ExecutableSQL<void> {
  return dbPool.createExecutableSQL(
    insertIntoValues(user_role_bind.name, { user_id: userId, role_id: roleId })
      .onConflict(["user_id", "role_id"])
      .doNotThing(),
  );
}

export function deleteUserRole(userId: number, roleId: string): ExecutableSQL<void> {
  return dbPool.createExecutableSQL(
    deleteFrom(user_role_bind.name).where(`user_id = ${v(userId)} AND role_id = ${v(roleId)}`),
  );
}

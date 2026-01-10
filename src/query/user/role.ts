import { deleteFrom } from "@asla/yoursql";
import { dbPool, ExecutableSQL } from "../../common/dbclient.ts";
import { insertIntoValues, v } from "../../common/sql.ts";

export type Role = {
  id: string;
  description?: string;
  roleName: string;
};
export function createRole(roleData: Role): ExecutableSQL<void> {
  return dbPool.createExecutableSQL(insertIntoValues("role", roleData).returning("id"));
}

export function addRoleToUser(userId: number, roleId: string): ExecutableSQL<void> {
  return dbPool.createExecutableSQL(
    insertIntoValues("user_role_bind", { user_id: userId, role_id: roleId })
      .onConflict(["user_id", "role_id"])
      .doNotThing(),
  );
}

export function deleteUserRole(userId: number, roleId: string): ExecutableSQL<void> {
  return dbPool.createExecutableSQL(
    deleteFrom("user_role_bind").where(`user_id = ${v(userId)} AND role_id = ${v(roleId)}`),
  );
}

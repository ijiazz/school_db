import { v } from "@asla/yoursql";
import { role, user_role_bind } from "@ijia/data/db";
import { deleteFrom } from "@asla/yoursql";
import { dbPool, ExecutableSql } from "@ijia/data/dbclient";
import { insertIntoValues } from "../../common/sql.ts";

export type Role = {
  id: string;
  description?: string;
  roleName: string;
};
export function createRole(roleData: Role): ExecutableSql<void> {
  return insertIntoValues(role.name, roleData).returning("id").client(dbPool);
}

export function addRoleToUser(userId: number, roleId: string): ExecutableSql<void> {
  return insertIntoValues(user_role_bind.name, { user_id: userId, role_id: roleId })
    .onConflict(["user_id", "role_id"])
    .doNotThing().client(dbPool);
}

export function deleteUserRole(userId: number, roleId: string): ExecutableSql<void> {
  return deleteFrom(user_role_bind.name).where(`user_id = ${v(userId)} AND role_id = ${v(roleId)}`).client(
    dbPool,
  );
}

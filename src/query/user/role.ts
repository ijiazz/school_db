import { role, user_role_bind } from "@ijia/data/db";

export type Role = {
  id: string;
  description?: string;
  roleName: string;
};
export async function createRole(roleData: Role): Promise<void> {
  await role
    .insert({ id: roleData.id, description: roleData.description, role_name: roleData.roleName })
    .returning("id")
    .queryCount();
}

export async function addRoleToUser(userId: number, roleId: string): Promise<void> {
  await user_role_bind
    .insert({ user_id: userId, role_id: roleId })
    .onConflict(["user_id", "role_id"])
    .doNotThing()
    .queryCount();
}

export async function deleteUserRole(userId: number, roleId: string): Promise<void> {
  await user_role_bind.delete({ where: `user_id = ${userId} AND role_id = ${roleId}` }).queryCount();
}

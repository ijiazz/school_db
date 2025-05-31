import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("INT", true),
  role_id: dbTypeMap.genColumn("VARCHAR", true),
} satisfies TableDefined;

export type DbUserRoleBind = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserRoleBindCreate = PickColumn<DbUserRoleBind, "role_id" | "user_id">;

export const user_role_bind = createTable<DbUserRoleBind, DbUserRoleBindCreate>("user_role_bind", TABLE_DEFINE);

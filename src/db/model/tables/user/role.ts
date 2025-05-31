import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  id: dbTypeMap.genColumn("VARCHAR", true),
  role_name: dbTypeMap.genColumn("VARCHAR"),
  description: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;

export type DbRole = InferTableDefined<typeof TABLE_DEFINE>;
export type DbRoleCreate = ToInsertType<DbRole>;

export const role = createTable<DbRole, DbRoleCreate>("role", TABLE_DEFINE);

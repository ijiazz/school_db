import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("INT", true),
  class_id: dbTypeMap.genColumn("INT", true),
  create_time: dbTypeMap.genColumn("TIMESTAMP", true, "now()"),
} satisfies TableDefined;

export type DbUserClassBind = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserClassBindCreate = PickColumn<DbUserClassBind, "class_id" | "user_id">;

export const user_class_bind = createTable<DbUserClassBind, DbUserClassBindCreate>("user_class_bind", TABLE_DEFINE);

import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../_sql_value.ts";

const TABLE_DEFINE = {
  name: dbTypeMap.genColumn("VARCHAR", true),
  level: dbTypeMap.genColumn("VARCHAR", true),
  info: dbTypeMap.genColumn("VARCHAR", true),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()"),
} satisfies TableDefined;

export type DbLog = InferTableDefined<typeof TABLE_DEFINE>;
export type DbLogCreate = PickColumn<DbLog, "info" | "level" | "name">;

export const log = createTable<DbLog, DbLogCreate>("sys.log", TABLE_DEFINE);

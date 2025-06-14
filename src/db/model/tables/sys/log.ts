import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";
import type { LogLevel } from "../../const.ts";

const TABLE_DEFINE = {
  name: dbTypeMap.genColumn("VARCHAR", true),
  level: dbTypeMap.genColumn<LogLevel>("VARCHAR", true),
  info: dbTypeMap.genColumn("JSONB", true),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()"),
} satisfies TableDefined;

export type DbLog = InferTableDefined<typeof TABLE_DEFINE>;
export type DbLogCreate = ToInsertType<DbLog, "create_time">;

export const log = createTable<DbLog, DbLogCreate>("sys.log", TABLE_DEFINE);

import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const classDefine = {
  id: dbTypeMap.genColumn("SERIAL", true),
  class_name: dbTypeMap.genColumn("VARCHAR"),
  description: dbTypeMap.genColumn("VARCHAR"),
  parent_class_id: dbTypeMap.genColumn("INT"),
} satisfies TableDefined;

export type DbClass = InferTableDefined<typeof classDefine>;
export type DbClassCreate = Omit<ToInsertType<DbClass>, "id">;

export const dclass = createTable<DbClass, DbClassCreate>("class", classDefine);

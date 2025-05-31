import type { InferTableDefined, PickColumn, TableDefined } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const classDefine = {
  id: dbTypeMap.genColumn("SERIAL", true),
  class_name: dbTypeMap.genColumn("VARCHAR"),
  description: dbTypeMap.genColumn("VARCHAR"),
  parent_class_id: dbTypeMap.genColumn("INT"),
} satisfies TableDefined;

const classCreateKeys = ["class_name", "description", "parent_class_id"] as const;

export type DbClass = InferTableDefined<typeof classDefine>;
export type DbClassCreate = PickColumn<DbClass, (typeof classCreateKeys)[number]>;

export const dclass = createTable<DbClass, DbClassCreate>("class", classDefine);

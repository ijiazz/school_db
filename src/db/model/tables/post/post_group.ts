import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  id: dbTypeMap.genColumn("SERIAL", true),
  name: dbTypeMap.genColumn("VARCHAR"),
  description: dbTypeMap.genColumn("VARCHAR"),
  public_sort: dbTypeMap.genColumn("SMALLINT"),
} satisfies TableDefined;
export type DbPostGroup = InferTableDefined<typeof DEFINE>;
export type DbPostGroupCreate = Omit<ToInsertType<DbPostGroup>, "id">;
export const post_group = createTable<DbPostGroup, DbPostGroupCreate>("post_group", DEFINE);

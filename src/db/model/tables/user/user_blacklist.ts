import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const TABLE_DEFINE = {
  user_id: dbTypeMap.genColumn("INT", true),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  reason: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;

export type DbUserBlackList = InferTableDefined<typeof TABLE_DEFINE>;
export type DbUserBlackListCreate = ToInsertType<DbUserBlackList, "create_time">;

export const user_blacklist = createTable<DbUserBlackList, DbUserBlackListCreate>("user_blacklist", TABLE_DEFINE);

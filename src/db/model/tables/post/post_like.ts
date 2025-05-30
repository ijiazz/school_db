import type { InferTableDefined, TableDefined, ToInsertType } from "@asla/yoursql";
import { createTable, dbTypeMap } from "../../_sql_value.ts";

const DEFINE = {
  post_id: dbTypeMap.genColumn("INT", true),
  user_id: dbTypeMap.genColumn("INT", true),
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "'now()'"),
  is_like: dbTypeMap.genColumn("BOOLEAN", true, "'TRUE'"),
  reason: dbTypeMap.genColumn("VARCHAR"),
} satisfies TableDefined;
export type DbPostLike = InferTableDefined<typeof DEFINE>;
export type DbPostLikeCreate = ToInsertType<DbPostLike, "create_time" | "is_like">;
export const post_like = createTable<DbPostLike, DbPostLikeCreate>("post_like", DEFINE);

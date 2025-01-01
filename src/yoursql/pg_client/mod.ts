import pg from "pg";
import { getEnv } from "../../common/get_env.ts";
import type { DbPool } from "../connect_abstract/pool.ts";

export * from "./connect.ts";
import { createPgPool } from "./connect.ts";
const pgTypes = pg.types;

pgTypes.setTypeParser(pgTypes.builtins.INT8, BigInt);

export function getDbUrl(): URL {
  const dbUrlStr = getEnv("DATABASE_URL", true);
  try {
    return new URL(dbUrlStr);
  } catch (error) {
    throw new Error("环境变量 DATABASE_URL 不符合规范", { cause: error });
  }
}

let dbClient: DbPool | undefined;

export function setDbPool(pool: DbPool) {
  dbClient = pool;
}
export function getDbPool(): DbPool {
  if (dbClient) return dbClient;
  const DB_URL = getDbUrl();
  const pgClient = createPgPool(DB_URL);
  dbClient = pgClient;
  console.log(`Database: ${DB_URL.protocol + "//" + DB_URL.host + DB_URL.pathname}`);
  return dbClient;
}

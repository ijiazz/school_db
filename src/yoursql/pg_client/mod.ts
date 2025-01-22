import pg from "pg";
import { getEnv } from "../../common/get_env.ts";
import type { DbPool } from "../connect_abstract/pool.ts";

export * from "./connect.ts";
import { createPgPool } from "./connect.ts";
const pgTypes = pg.types;

pgTypes.setTypeParser(pgTypes.builtins.INT8, BigInt);

export function getDbUrl(): URL | undefined {
  return dbClient?.url;
}

let dbClient: { pool: DbPool; url: URL };

export function setDbPool(pool: DbPool, url: URL) {
  if (dbClient) throw new Error("DbPool 已经创建");
  dbClient = { pool, url };
}
export function getDbPool(): DbPool {
  if (dbClient) return dbClient.pool;
  const dbUrlStr = getEnv("DATABASE_URL", true);
  let url: URL;
  try {
    url = new URL(dbUrlStr);
  } catch (error) {
    throw new Error("环境变量 DATABASE_URL 不符合规范", { cause: error });
  }

  const pgClient = createPgPool(url);
  setDbPool(pgClient, url);
  console.log(`Database: ${url.protocol + "//" + url.host + url.pathname}`);
  return dbClient;
}

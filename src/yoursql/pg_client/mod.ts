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

let dbClient: { pool: DbPool; url?: URL } | undefined;

export function setDbPool(pool: DbPool, url?: URL) {
  if (dbClient) {
    dbClient.pool.close(true);
    console.warn("Update Database instance", url?.toString() ?? "no url");
  }
  dbClient = { pool, url };
  return pool;
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

  if (url) {
    console.log(`Set Database: ${url.protocol + "//" + url.host + url.pathname}`);
  } else console.log(`Set Database, no url`);

  const pgClient = createPgPool(url);
  setDbPool(pgClient, url);
  return dbClient!.pool;
}

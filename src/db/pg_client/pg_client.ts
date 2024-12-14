import pg from "pg";
import { getEnv } from "../../common/get_env.ts";
import { PgDbPool } from "./_pg_pool.ts";
import type { DbPool } from "../connect_abstract/pool.ts";
const pgTypes = pg.types;

pgTypes.setTypeParser(pgTypes.builtins.INT8, BigInt);

export interface DbConnectOption {
  database: string;
  user?: string;
  password?: string;
  hostname?: string;
  port?: number;
}
export function parserDbUrl(url: URL | string): DbConnectOption {
  if (typeof url === "string") url = new URL(url);
  return {
    database: url.pathname.slice(1),
    hostname: url.hostname,
    port: +url.port,
    password: url.password ? url.password : undefined,
    user: url.username ? url.username : undefined,
  };
}
export function getDbUrl(): URL {
  const dbUrlStr = getEnv("DATABASE_URL", true);
  try {
    return new URL(dbUrlStr);
  } catch (error) {
    throw new Error("环境变量 DATABASE_URL 不符合规范", { cause: error });
  }
}

export function createPgDbClient(url: string | URL | DbConnectOption): PgDbPool {
  return new PgDbPool(createPgPool(url), (e) => console.error("数据库异常", e));
}
export function createPgPool(url: string | URL | DbConnectOption) {
  let option: DbConnectOption;
  if (typeof url === "string" || url instanceof URL) option = parserDbUrl(url);
  else option = url;
  return new pg.Pool({
    database: option.database,
    user: option.user,
    password: option.password,
    host: option.hostname,
    port: option.port,
  });
}
let dbClient: DbPool | undefined;

export function setDbPool(pool: DbPool) {
  dbClient = pool;
}
export function getDbPool(): DbPool {
  if (dbClient) return dbClient;
  const DB_URL = getDbUrl();
  const pgClient = createPgDbClient(DB_URL);
  dbClient = pgClient;
  console.log(`Database: ${DB_URL.protocol + "//" + DB_URL.host + DB_URL.pathname}`);
  return dbClient;
}

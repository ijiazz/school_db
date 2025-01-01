import pg from "pg";
import { PgDbPool } from "./_pg_pool.ts";
import { PgConnection } from "./_pg_connect.ts";
import type { DbConnection, DbPool } from "../connect_abstract/mod.ts";

export interface DbConnectOption {
  database: string;
  user?: string;
  password?: string;
  hostname?: string;
  port?: number;
}
export function createPgPool(url: string | URL | DbConnectOption): DbPool {
  let option: DbConnectOption;
  if (typeof url === "string" || url instanceof URL) option = parserDbUrl(url);
  else option = url;
  const pool = new pg.Pool({
    database: option.database,
    user: option.user,
    password: option.password,
    host: option.hostname,
    port: option.port,
  });
  return new PgDbPool(pool, (e) => console.error("数据库异常", e));
}

export async function createPgClient(url: string | URL | DbConnectOption): Promise<DbConnection> {
  let option: DbConnectOption;
  if (typeof url === "string" || url instanceof URL) option = parserDbUrl(url);
  else option = url;

  const pgClient = new pg.Client(option);
  await pgClient.connect();
  return new PgConnection(pgClient);
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

import { SqlQueryStatement } from "@asla/yoursql";
//@deno-types="npm:@types/pg"
import pg, { Pool, PoolClient } from "pg";
import type { DbClient, DbTransactions, QueryResult } from "./db_query.ts";
import { getEnv } from "../_deps/get_env.ts";
import { DbQuery } from "./db_query.ts";

class PgDbClient extends DbQuery implements DbClient {
  constructor(pool: Pool) {
    super();
    this.#pool = pool;
    this.closed = new Promise<void>((resolve, reject) => {
      this.#resolveClose = resolve;
      this.#pool.on("error", reject);
    });
  }
  #pool: Pool;
  async begin(): Promise<DbTransactions> {
    const client = await this.#pool.connect();
    this.#clientList.add(client);
    client.on("end", () => this.#clientList.delete(client));
    try {
      await client.query("BEGIN");
      return new PgTransactions(client);
    } catch (error) {
      client.release(error instanceof Error ? error : true);
      throw error;
    }
  }
  #clientList = new Set<PoolClient>();
  query<T extends object = any>(
    sql: SqlQueryStatement<any> | string | { toString(): string }
  ): Promise<QueryResult<T>> {
    return this.#pool.query<T>(sql.toString());
  }

  end() {
    const error = new Error("Pool has been ended");
    for (const item of this.#clientList) {
      item.release(error);
    }
    this.#clientList.clear();

    const f = this.#pool.end();
    f.then(this.#resolveClose);
    return f;
  }
  #resolveClose!: () => void;
  readonly closed: Promise<void>;
}

class PgTransactions extends DbQuery implements DbTransactions {
  constructor(client: PoolClient) {
    super();
    this.#client = client;
  }
  #client: PoolClient;
  query<T extends object = any>(
    sql: SqlQueryStatement<any> | string | { toString(): string }
  ): Promise<QueryResult<T>> {
    return this.#client.query<T>(sql.toString());
  }
  async rollback() {
    await this.query("ROLLBACK");
  }
  async commit() {
    await this.query("COMMIT");
  }
  release() {
    this.#client.release();
  }
}
export function createPgDbClient(url: string | URL): DbClient {
  if (typeof url === "string") url = new URL(url);
  const DB_URL = url;
  const db = DB_URL.pathname.slice(1);
  const pool = new pg.Pool({
    database: db,
    user: DB_URL.username,
    password: DB_URL.password ? DB_URL.password : undefined,
    host: DB_URL.hostname,
    port: +DB_URL.port,
  });
  return new PgDbClient(pool);
}

let pgClient: DbClient | undefined;

export function setClient(client: DbClient) {
  if (pgClient) throw new Error("client 已存在");
  pgClient = client;
}
export function getClient(): DbClient {
  if (pgClient) return pgClient;
  const DB_URL = getDbUrl();
  pgClient = createPgDbClient(DB_URL);
  console.log(`Database: ${DB_URL.protocol + "//" + DB_URL.host + DB_URL.pathname}`);
  return pgClient;
}
export function getDbUrl(): URL {
  const dbUrlStr = getEnv("DATABASE_URL", true);
  try {
    return new URL(dbUrlStr);
  } catch (error) {
    throw new Error("环境变量 DATABASE_URL 不符合规范", { cause: error });
  }
}

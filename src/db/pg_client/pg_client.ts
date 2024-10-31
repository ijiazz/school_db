import { SqlQueryStatement } from "@asla/yoursql";
import pg, { Pool, PoolClient } from "pg";
import Cursor from "pg-cursor";
import type { DbClient, DbCursor, DbTransactions, QueryResult } from "./db_query.ts";
import { getEnv } from "../../common/get_env.ts";
import { DbQuery } from "./db_query.ts";

class PgCursor<T extends {}> implements DbCursor<T> {
  constructor(cursor: Cursor<T>, onClose?: () => void) {
    this.#cursor = cursor;
    this.#onClose = onClose;
  }
  #onClose?: () => void;
  #cursor: Cursor<T>;
  read(number: number): Promise<T[]> {
    return this.#cursor.read(number);
  }
  async close(): Promise<void> {
    await this.#cursor.close();
    this.#onClose?.();
    this.#onClose = undefined;
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
  async *[Symbol.asyncIterator](chunkSize: number = 20): AsyncGenerator<T, undefined, undefined> {
    const cursor = await this.#cursor;
    try {
      let chunk = await cursor.read(chunkSize);
      while (chunk.length) {
        yield* chunk;
        chunk = await cursor.read(chunkSize);
      }
    } finally {
      await this.close();
    }
  }
}

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
    const onRelease = () => this.#clientList.delete(client);
    //@ts-ignore
    client.on("release", onRelease);
    client.on("end", onRelease);
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
  async createCursor<T extends object = any>(sql: { toString(): string }): Promise<DbCursor<T>> {
    const connect = await this.#pool.connect();
    const cursor = connect.query(new Cursor<T>(sql.toString()));
    return new PgCursor<T>(cursor, connect.release.bind(connect));
  }

  end(force?: boolean) {
    const error = new Error("Pool has been ended");
    if (force) {
      for (const item of this.#clientList) {
        item.release(error);
      }
      this.#clientList.clear();
    }

    const f = this.#pool.end();
    f.then(this.#resolveClose);
    return f;
  }
  [Symbol.asyncDispose]() {
    return this.end();
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
  async createCursor<T extends object = any>(sql: { toString(): string }): Promise<DbCursor<T>> {
    const cursor = this.#client.query(new Cursor<T>(sql.toString()));
    return new PgCursor<T>(cursor);
  }
  async rollback() {
    await this.query("ROLLBACK");
  }
  async commit() {
    await this.query("COMMIT");
  }
  release() {
    //todo 调用如果存在光标，应中断光标
    this.#client.release();
    this.#client.emit("release");
  }
  [Symbol.dispose]() {
    return this.release();
  }
}

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
export function createPgDbClient(url: string | URL | DbConnectOption): DbClient {
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
  return new PgDbClient(pool);
}

let pgClient: DbClient | undefined;

export function setClient(client: DbClient) {
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

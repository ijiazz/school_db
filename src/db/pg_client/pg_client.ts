import pg from "pg";
import type { Pool, PoolClient } from "pg";
import Cursor from "pg-cursor";
import type { DbPool, DbCursor, DbPoolConnection, QueryResult, TransactionMode } from "./db_query.ts";
import { getEnv } from "../../common/get_env.ts";
import { DbQuery } from "./db_query.ts";
const pgTypes = pg.types;

pgTypes.setTypeParser(pgTypes.builtins.INT8, BigInt);

class PgCursor<T extends {}> implements DbCursor<T> {
  /** @param connect 如果传入，则关闭游标时会调用 connect.release() */
  constructor(cursor: Cursor<T>, connect?: PoolClient) {
    this.#cursor = cursor;
    this.#connect = connect;
  }
  #connect?: PoolClient;
  #cursor: Cursor<T>;
  read(number: number): Promise<T[]> {
    return this.#cursor.read(number);
  }
  async close(): Promise<void> {
    await this.#cursor.close();
    if (!this.#connect) return;
    this.#connect.release();
    this.#connect = undefined;
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
}

class PgDbPool extends DbQuery implements DbPool {
  constructor(pool: Pool) {
    super();
    this.#pool = pool;
    this.closed = new Promise<void>((resolve, reject) => {
      this.#resolveClose = resolve;
      this.#pool.on("error", reject);
    });
  }
  // implement
  async connect(): Promise<PgPoolConnection> {
    const conn = await this.#pool.connect();
    this.#clientList.add(conn);
    const onRelease = () => this.#clientList.delete(conn);
    //@ts-ignore
    conn.on("release", onRelease);
    conn.on("end", onRelease);
    return new PgPoolConnection(conn);
  }
  async connectBegin(mode?: TransactionMode): Promise<PgPoolConnection> {
    const connect = await this.connect();
    try {
      await connect.begin(mode);
      return connect;
    } catch (error) {
      connect.release();
      throw error;
    }
  }
  #pool: Pool;
  #clientList = new Set<PoolClient>();
  // implement
  query<T extends object = any>(sql: ToString): Promise<QueryResult<T>> {
    return this.#pool.query<T>(sql.toString());
  }
  // implement
  async createCursor<T extends object = any>(sql: ToString): Promise<DbCursor<T>> {
    const connect = await this.#pool.connect();
    const cursor = connect.query(new Cursor<T>(sql.toString()));
    return new PgCursor<T>(cursor, connect);
  }
  // implement
  close(force?: boolean) {
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
  // implement
  [Symbol.asyncDispose](): PromiseLike<void> {
    return this.close();
  }
  #resolveClose!: () => void;
  // implement
  readonly closed: Promise<void>;
}
class PgListen implements Disposable {
  constructor(
    private event: string,
    private connect?: PoolClient
  ) {
    if (event.includes(";")) throw new Error("event 不能包含 ';' 字符");
  }
  dispose() {
    if (!this.connect) return;
    this.connect.query("UNLISTEN " + this.event);
    this.connect = undefined;
  }
  [Symbol.dispose]() {
    this.dispose();
  }
  async [Symbol.asyncIterator]() {
    const connect = this.connect;
    if (!connect) throw new Error("Listener 已释放");
    const promise = connect.query("LISTEN " + this.event);
    connect.on("notification", (msg) => {});
  }
}

class PgPoolConnection extends DbQuery implements DbPoolConnection {
  constructor(client: PoolClient) {
    super();
    this.#client = client;
  }
  async begin(mode?: TransactionMode): Promise<void> {
    await this.query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""));
  }
  #client: PoolClient;
  query<T extends object = any>(sql: ToString): Promise<QueryResult<T>> {
    return this.#client.query<T>(sql.toString());
  }
  async createCursor<T extends object = any>(sql: ToString): Promise<DbCursor<T>> {
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
type ToString = { toString(): string };
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
  return new PgDbPool(createPgPool(url));
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
  pgClient.closed.catch((e) => console.error("数据库异常", e));
  dbClient = pgClient;
  console.log(`Database: ${DB_URL.protocol + "//" + DB_URL.host + DB_URL.pathname}`);
  return dbClient;
}

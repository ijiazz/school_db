import type { Client, PoolClient } from "pg";
import { PgCursor } from "./_pg_cursor.ts";
import {
  DbCursor,
  DbCursorOption,
  DbPoolConnection,
  DbPoolTransaction,
  DbQuery,
  DbTransaction,
  MultipleQueryResult,
  StringLike,
  TransactionMode,
} from "@asla/yoursql/client";
import { addPgErrorInfo } from "./_error_handler.ts";
import Cursor from "pg-cursor";
import { parserDbUrl, PgConnection } from "./pg_connect.ts";
import type { DbPool } from "../type.ts";
import { ResourcePool } from "evlib/async";
import { createPgClient } from "./_pg_client.ts";
import type { DbConnectOption } from "./type.ts";

export class PgDbPool extends DbQuery implements DbPool {
  #pool: ResourcePool<Client>;
  constructor(url: URL | string | (() => URL | string)) {
    super();
    if (typeof url === "function") {
      this.#getConnectUrl = url;
    } else {
      this.#connectOption = parserDbUrl(url);
    }
    this.#pool = this.#createPool();
  }
  #createPool() {
    return new ResourcePool<Client>({
      create: async () => {
        const pool = this.#pool;
        const pgClient = createPgClient(this.connectOption);
        pgClient.on("end", () => pool.remove(pgClient));
        pgClient.on("error", () => pool.remove(pgClient));
        try {
          await pgClient.connect();
          return pgClient;
        } catch (error) {
          throw new Error("连接数据库失败", { cause: error });
        }
      },
      dispose: (conn) => {
        conn.end().catch((e) => {
          console.error(e);
        });
      },
    }, { maxCount: 50, idleTimeout: 5000, usageLimit: 9999 });
  }
  #getConnectUrl?: () => string | URL;
  #connectOption?: DbConnectOption;
  set connectOption(url: URL | string | DbConnectOption) {
    if (typeof url === "object" && !(url instanceof URL)) this.#connectOption = url;
    else {
      this.#connectOption = parserDbUrl(url);
    }
  }
  get connectOption(): DbConnectOption {
    if (!this.#connectOption) {
      this.#connectOption = parserDbUrl(this.#getConnectUrl!());
    }
    return this.#connectOption;
  }
  // implement
  async connect(): Promise<DbPoolConnection> {
    const conn = await this.#pool.get();
    return new DbPoolConnection(new PgConnection(conn), () => this.#pool.release(conn));
  }
  override async query<T>(sql: StringLike): Promise<T> {
    const text = sql.toString();
    using conn = await this.connect();
    return conn.query(text).catch((e) => addPgErrorInfo(e, text)) as Promise<T>;
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: StringLike): Promise<T> {
    return this.query(sql);
  }

  //implement
  begin(mode?: TransactionMode): DbTransaction {
    return new DbPoolTransaction(() => this.connect(), { mode, errorRollback: true });
  }
  //implement
  async cursor<T extends object = any>(sql: StringLike, option?: DbCursorOption): Promise<DbCursor<T>> {
    const conn = await this.#pool.get();
    const cursor = conn.query(new Cursor(sql.toString()));
    const poolConn = new DbPoolConnection(new PgConnection(conn), () => this.#pool.release(conn));
    return new PgCursor(cursor, poolConn, option?.defaultSize);
  }
  // implement
  close(force?: boolean) {
    return this.#pool.close(force);
  }
  /** 打开连接 */
  open() {
    if (this.#pool.closed) {
      this.#pool = this.#createPool();
    }
  }
  // implement
  [Symbol.asyncDispose](): PromiseLike<void> {
    return this.close();
  }
  /** 如果为 true, 则不会在创建新连接 */
  get closed() {
    return this.#pool.closed;
  }
  get totalCount() {
    return this.#pool.totalCount;
  }
  get idleCount(): number {
    return this.#pool.idleCount;
  }
}
class PgListen implements Disposable {
  constructor(
    private event: string,
    private connect?: PoolClient,
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

/*
  pg 的一些行为
   PoolClient 重复 release() 会抛出异常
   Cursor 如果 close() 之后继续 read() ，会返回空数组
   Cursor read() 在回调前继续 read() , 回调函数会永远无法解决
*/

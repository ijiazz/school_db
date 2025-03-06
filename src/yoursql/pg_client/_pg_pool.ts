import type { Client, ClientConfig, PoolClient } from "pg";
import { PgCursor } from "./_pg_cursor.ts";
import {
  DbCursor,
  DbCursorOption,
  DbPoolConnection,
  DbPoolTransaction,
  DbQuery,
  DbTransaction,
  MultipleQueryResult,
  TransactionMode,
} from "@asla/yoursql/client";
import { addPgErrorInfo } from "./_error_handler.ts";
import Cursor from "pg-cursor";
import pg from "pg";
import { PgConnection } from "./_pg_connect.ts";
import type { DbPool } from "../type.ts";
import { ResourcePool } from "evlib/async";

export class PgDbPool extends DbQuery implements DbPool {
  #pool: ResourcePool<Client>;
  constructor(connectOption: string | ClientConfig) {
    super();
    this.#pool = new ResourcePool<Client>({
      create: async () => {
        const pgClient = new pg.Client(connectOption);
        pgClient.on("end", () => this.#pool.remove(pgClient));
        pgClient.on("error", () => this.#pool.remove(pgClient));
        await pgClient.connect();
        return pgClient;
      },
      dispose: (conn) => {
        conn.end().catch((e) => {
          console.error(e);
        });
      },
    }, { maxCount: 50 });
  }
  // implement
  async connect(): Promise<DbPoolConnection> {
    const conn = await this.#pool.get();
    return new DbPoolConnection(new PgConnection(conn), () => this.#pool.release(conn));
  }
  override async query<T>(sql: ToString): Promise<T> {
    const text = sql.toString();
    using conn = await this.connect();
    return conn.query(text).catch((e) => addPgErrorInfo(e, text)) as Promise<T>;
  }
  override multipleQuery(sql: ToString): Promise<MultipleQueryResult> {
    return this.query(sql);
  }

  //implement
  begin(mode?: TransactionMode): DbTransaction {
    return new DbPoolTransaction(() => this.connect(), mode);
  }
  //implement
  async cursor<T extends object = any>(sql: ToString, option?: DbCursorOption): Promise<DbCursor<T>> {
    const conn = await this.#pool.get();
    const cursor = conn.query(new Cursor(sql.toString()));
    const poolConn = new DbPoolConnection(new PgConnection(conn), () => this.#pool.release(conn));
    return new PgCursor(cursor, poolConn, option?.defaultSize);
  }
  // implement
  close(force?: boolean) {
    return this.#pool.close(force);
  }
  // implement
  [Symbol.asyncDispose](): PromiseLike<void> {
    return this.close();
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

type ToString = { toString(): string };

/*
  pg 的一些行为
   PoolClient 重复 release() 会抛出异常
   Cursor 如果 close() 之后继续 read() ，会返回空数组
   Cursor read() 在回调前继续 read() , 回调函数会永远无法解决
*/

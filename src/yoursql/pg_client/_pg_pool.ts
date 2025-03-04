import type { Pool, PoolClient } from "pg";
import { PgCursor } from "./_pg_cursor.ts";
import { ConnectionNotAvailableError, DbPoolTransaction, DbQuery } from "../connect_abstract/mod.ts";
import type {
  DbCursor,
  DbCursorOption,
  DbPool,
  DbPoolConnection,
  DbTransaction,
  MultipleQueryResult,
  TransactionMode,
} from "../connect_abstract/mod.ts";
import { addPgErrorInfo } from "./_error_handler.ts";
import Cursor from "pg-cursor";

export class PgDbPool extends DbQuery implements DbPool {
  constructor(pool: Pool, onError?: (err: any) => void) {
    super();
    this.#pool = pool;
    if (onError) this.#pool.on("error", onError);
  }
  // implement
  connect(): Promise<PgPoolConnection> {
    return this.#connectRaw().then((conn) => new PgPoolConnection(conn));
  }
  async #connectRaw() {
    const conn = await this.#pool.connect();
    this.#clientList.add(conn);
    const onRelease = () => {
      this.#clientList.delete(conn);
    };
    //@ts-ignore
    conn.on("release", onRelease);
    conn.on("end", onRelease);
    conn.on("error", onRelease);
    return conn;
  }
  #pool: Pool;
  #clientList = new Set<PoolClient>();
  override query<T>(sql: ToString): Promise<T> {
    const text = sql.toString();
    return this.#pool.query(text).catch((e) => addPgErrorInfo(e, text)) as Promise<T>;
  }
  override multipleQuery(sql: ToString): Promise<MultipleQueryResult> {
    return this.query(sql);
  }
  get idleCount(): number {
    return this.#pool.idleCount;
  }
  //implement
  begin(mode?: TransactionMode): DbTransaction {
    return new DbPoolTransaction(() => this.connect(), mode);
  }
  //implement
  async cursor<T extends object = any>(sql: ToString, option?: DbCursorOption): Promise<DbCursor<T>> {
    const conn = await this.#connectRaw();
    const cursor = conn.query(new Cursor(sql.toString()));
    return new PgCursor(cursor, new PgPoolConnection(conn), option?.defaultSize);
  }
  // implement
  close(force?: boolean) {
    if (this.#pool.ended) return Promise.resolve();
    if (force) {
      const error = new Error("Pool has been ended");
      for (const item of this.#clientList) {
        item.release(error);
      }
      this.#clientList.clear();
    }
    return this.#pool.end().then(this.#resolveClose);
  }
  // implement
  [Symbol.asyncDispose](): PromiseLike<void> {
    return this.close();
  }
  get totalCount() {
    return this.#pool.totalCount;
  }
  #resolveClose!: () => void;
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

export class PgPoolConnection extends DbQuery implements DbPoolConnection {
  constructor(pool: PoolClient) {
    super();
    this.#pool = pool;
  }
  //implement
  async begin(mode?: TransactionMode): Promise<void> {
    await this.query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""));
  }
  #pool?: PoolClient;
  //implement
  async query<T = any>(sql: ToString): Promise<T> {
    if (!this.#pool) throw new ConnectionNotAvailableError("Connection already release");
    const text = sql.toString();
    return this.#pool.query<any>(text).catch((e: any) => addPgErrorInfo(e, text));
  }
  override multipleQuery(sql: ToString): Promise<MultipleQueryResult> {
    return this.query(sql);
  }
  //implement
  async rollback() {
    await this.query("ROLLBACK");
  }
  //implement
  async commit() {
    await this.query("COMMIT");
  }
  get released() {
    return !this.#pool;
  }
  //implement
  release() {
    //todo 调用如果存在光标，应中断光标
    if (this.#pool) {
      const pool = this.#pool;
      this.#pool = undefined;
      pool.release();
      pool.emit("release");
    }
  }
  //implement
  [Symbol.dispose]() {
    return this.release();
  }
}
type ToString = { toString(): string };

/*
  pg 的一些行为
   PoolClient 重复 release() 会抛出异常
   Cursor 如果 close() 之后继续 read() ，会返回空数组
   Cursor read() 在回调前继续 read() , 回调函数会永远无法解决
*/

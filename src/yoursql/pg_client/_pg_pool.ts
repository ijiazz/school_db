import type { Pool, PoolClient } from "pg";
import { PgPoolCursor } from "./_pg_cursor.ts";
import { DbPoolTransaction, DbQuery } from "../connect_abstract/mod.ts";
import type {
  DbCursor,
  DbCursorOption,
  DbPool,
  DbPoolConnection,
  DbTransaction,
  QueryRowsResult,
  TransactionMode,
} from "../connect_abstract/mod.ts";

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
    return conn;
  }
  #pool: Pool;
  #clientList = new Set<PoolClient>();
  // implement
  query<T extends object = any>(sql: ToString): Promise<QueryRowsResult<T>> {
    return this.#pool.query<T>(sql.toString());
  }
  get idleCount(): number {
    return this.#pool.idleCount;
  }
  //implement
  begin(mode?: TransactionMode): DbTransaction {
    return new DbPoolTransaction(() => this.connect(), mode);
  }
  //implement
  cursor<T extends object = any>(sql: ToString, option?: DbCursorOption): DbCursor<T> {
    return new PgPoolCursor(sql.toString(), (cursor) =>
      this.#connectRaw().then((conn) => {
        conn.query(cursor);
        return new PgPoolConnection(conn);
      }), option?.defaultSize);
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
  get getConnectedNumber() {
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

export class PgPoolConnection extends DbQuery implements DbPoolConnection {
  constructor(pool: PoolClient) {
    super();
    this.#pool = pool;
  }
  //implement
  async begin(mode?: TransactionMode): Promise<void> {
    await this.query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""));
  }
  #pool: PoolClient;
  //implement
  query<T extends object = any>(sql: ToString): Promise<QueryRowsResult<T>> {
    return this.#pool.query<T>(sql.toString());
  }
  //implement
  async rollback() {
    await this.query("ROLLBACK");
  }
  //implement
  async commit() {
    await this.query("COMMIT");
  }
  //implement
  release() {
    //todo 调用如果存在光标，应中断光标
    this.#pool.release();
    this.#pool.emit("release");
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

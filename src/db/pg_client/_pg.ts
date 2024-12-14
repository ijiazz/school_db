import type { Pool, PoolClient } from "pg";
import Cursor from "pg-cursor";
import type { DbCursorOption, DbPool, DbPoolConnection, DbTransaction, QueryResult, TransactionMode } from "./type.ts";
import { DbCursor, DbQuery } from "./type.ts";
import { SqlQueryStatement } from "@asla/yoursql";

class PgCursor<T> extends DbCursor<T> {
  constructor(cursor: Cursor<T>, conn: PoolClient) {
    super();
    this.#cursor = cursor;
    this.#conn = conn;
  }
  #conn?: PoolClient;
  #cursor: Cursor<T>;
  // implement
  read(maxSize: number = 20): Promise<T[]> {
    return this.#cursor.read(maxSize);
  }
  // implement
  close(): Promise<void> {
    this.#conn?.release();
    this.#conn = undefined;
    return this.#cursor.close();
  }
}
class PgPoolCursor<T extends {}> extends DbCursor<T> {
  constructor(
    cursor: Cursor<T>,
    connect: () => Promise<PoolClient>,
    readonly defaultChunkSize = 20,
  ) {
    super();
    this.#cursor = cursor;
    this.#read = (maxSize: number) => {
      return new Promise<T[]>((resolve, reject) => {
        this.#waitConnect.push({ maxSize, reject, resolve });
        if (this.#waitConnect.length === 1) {
          this.#connect = connect(); //连接中

          this.#connect.then(async (conn) => {
            this.#connect = conn; // 已连接
            conn.query(this.#cursor);

            let item = this.#waitConnect.shift();
            while (item) {
              try {
                let res = await this.#cursor.read(item.maxSize);
                item.resolve(res);
              } catch (error) {
                item.reject(error);
              }
              item = this.#waitConnect.shift();
            }
            this.#waitConnect.length = 0;
            this.#read = this.#readAfterConnected;
          }, (e) => {
            for (const element of this.#waitConnect) {
              element.reject(e);
            }
            this.#waitConnect.length = 0;
          });
        }
      });
    };
  }

  #cursor: Cursor<T>;
  #connect?: PoolClient | Promise<PoolClient>;

  #waitConnect: { resolve(res: T[]): void; reject(e: any): void; maxSize: number }[] = [];

  #readAfterConnected(number: number) {
    return this.#cursor.read(number);
  }
  #read: (number: number) => Promise<T[]>;
  // implement
  read(maxSize: number = this.defaultChunkSize): Promise<T[]> {
    return this.#read(maxSize);
  }

  #closing?: Promise<void>;
  // implement
  async close(): Promise<void> {
    if (this.#connect) {
      this.#closing = this.#closeConn(this.#connect);
    }
    this.#read = () => Promise.resolve([]);
    return this.#closing;
  }
  async #closeConn(conn: Promise<PoolClient> | PoolClient) {
    // 获取过连接
    if (conn instanceof Promise) conn = await conn; // 等待
    await this.#cursor.close();
    conn.release();
    conn.emit("release");
  }
}
class PgPoolTransaction extends DbQuery implements DbTransaction {
  constructor(
    connect: () => Promise<PoolClient>,
    readonly mode?: TransactionMode,
  ) {
    super();
    this.#query = (sql: string) => {
      return new Promise<QueryResult<any>>((resolve, reject) => {
        this.#queue.push({ resolve, reject, sql });
        if (this.#queue.length === 1) {
          connect().then(async (conn) => {
            this.#conn = conn;
            this.#query = this.#queryAfter;
            const mode = this.mode;
            await conn
              .query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""))
              .catch(this.#onQueryError);
            for (const element of this.#queue) {
              this.#queryAfter(element.sql).then(element.resolve, element.reject);
            }
            this.#queue.length = 0;
          }, (e) => {
            for (const element of this.#queue) {
              element.reject(e);
            }
            this.#queue.length = 0;
          });
        }
      });
    };
  }
  #conn?: PoolClient;
  async commit(): Promise<void> {
    if (this.#conn) {
      const promise = this.#conn.query("COMMIT");
      this.#release();
      await promise;
    }
  }
  async rollback(): Promise<void> {
    if (this.#conn) {
      const promise = this.#conn.query("ROLLBACK");
      this.#release();
      await promise;
    }
  }
  savePoint(savePoint: string): Promise<void> {
    return this.#conn!.query("SAVEPOINT" + savePoint).then(() => {}, this.#onQueryError);
  }
  rollbackTo(savePoint: string): Promise<void> {
    return this.#conn!.query("ROLLBACK TO " + savePoint).then(() => {}, this.#onQueryError);
  }
  #queue: { sql: string; resolve(res: QueryResult<any>): void; reject(e: any): void }[] = [];

  /** 只要sql执行出错（事务中断），就释放连接 */
  #onQueryError = (e: Error) => {
    this.#conn?.release(e);
    throw e;
  };
  /** 拿到连接后执行这个 */
  #queryAfter(sql: string) {
    return this.#conn!.query(sql).catch(this.#onQueryError);
  }
  #query: (sql: string) => Promise<QueryResult<any>>;
  query<T extends object = any>(sql: SqlQueryStatement<T>): Promise<QueryResult<T>>;
  query<T extends object = any>(sql: { toString(): string }): Promise<QueryResult<T>>;
  query(sql: ToString): Promise<QueryResult<any>> {
    return this.#query(sql.toString());
  }
  #release() {
    if (this.#conn) {
      this.#conn.release();
      this.#conn.emit("release");
    }
    this.#isRelease = true;
  }
  #isRelease: boolean = false;
  [Symbol.dispose]() {
    if (this.#conn && !this.#isRelease) {
      throw new Error("事务未提交");
    }
  }
}

export class PgDbPool extends DbQuery implements DbPool {
  constructor(pool: Pool, onError?: (err: any) => void) {
    super();
    this.#pool = pool;
    if (onError) this.#pool.on("error", onError);
  }
  async #createPgConnect() {
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
  // implement
  async connect(): Promise<PgPoolConnection> {
    const conn = await this.#createPgConnect();
    return new PgPoolConnection(conn);
  }
  #pool: Pool;
  #clientList = new Set<PoolClient>();
  // implement
  query<T extends object = any>(sql: ToString): Promise<QueryResult<T>> {
    return this.#pool.query<T>(sql.toString());
  }

  //implement
  begin(mode?: TransactionMode): DbTransaction {
    return new PgPoolTransaction(() => this.#createPgConnect(), mode);
  }
  //implement
  cursor<T extends object = any>(sql: ToString, option?: DbCursorOption): DbCursor<T> {
    return new PgPoolCursor(new Cursor<T>(sql.toString()), () => this.#createPgConnect(), option?.defaultSize);
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
  query<T extends object = any>(sql: ToString): Promise<QueryResult<T>> {
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

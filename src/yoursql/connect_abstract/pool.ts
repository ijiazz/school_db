import type { SqlStatementDataset } from "@asla/yoursql";
import { DbQuery } from "./query.ts";
import type { DbCursor, DbTransaction, QueryResult, TransactionMode } from "./query.ts";

/**
 * @public
 * 池连接事务
 */
export class PoolTransaction extends DbQuery implements DbTransaction {
  constructor(
    connect: () => Promise<DbPoolConnection>,
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
  #conn?: DbPoolConnection;
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
    this.#conn?.release();
    throw e;
  };
  /** 拿到连接后执行这个 */
  #queryAfter(sql: string) {
    return this.#conn!.query(sql).catch(this.#onQueryError);
  }
  #query: (sql: string) => Promise<QueryResult<any>>;
  query<T extends object = any>(sql: SqlStatementDataset<T>): Promise<QueryResult<T>>;
  query<T extends object = any>(sql: { toString(): string }): Promise<QueryResult<T>>;
  query(sql: { toString(): string }): Promise<QueryResult<any>> {
    return this.#query(sql.toString());
  }
  #release() {
    this.#conn?.release();
    this.#isRelease = true;
  }
  #isRelease: boolean = false;
  [Symbol.dispose]() {
    if (this.#conn && !this.#isRelease) {
      this.rollback().catch(() => {});
      throw new Error("事务未提交");
    }
  }
}

/**
 * 池连接
 * @public
 */
export interface DbPoolConnection extends DbQuery, Disposable {
  /** 调用 release() 时，如果事务未提交，则抛出异常 */
  release(): void;
}
/**
 * 数据库连接
 */
export interface DbConnection extends DbQuery, AsyncDisposable {
  close(): Promise<void>;
}

/**
 * @public
 * 池链接查询
 */
export interface DbQueryPool extends DbQuery {
  connect(): Promise<DbPoolConnection>;

  begin(mode?: TransactionMode): DbTransaction;
  cursor<T extends {}>(sql: SqlStatementDataset<T>): DbCursor<T>;
  cursor<T>(sql: { toString(): string }, option?: DbCursorOption): DbCursor<T>;
}
/** @public */
export interface DbCursorOption {
  defaultSize?: number;
}
/**
 * 数据库连接池
 * @public
 */
export interface DbPool extends DbQueryPool, AsyncDisposable {
  /** 关闭所有链接。如果 force 为 true, 则直接断开所有连接，否则等待连接释放后再关闭 */
  close(force?: boolean): Promise<void>;
}

import type { SqlStatementDataset } from "@asla/yoursql";
import { DbQuery } from "./query.ts";
import type { DbCursor, DbTransaction, MultipleQueryResult, QueryRowsResult, TransactionMode } from "./query.ts";
import { ConnectionNotAvailableError, QueryNotCompletedError } from "../connect_abstract/errors.ts";

/**
 * @public
 * 池连接事务
 */
export class DbPoolTransaction extends DbQuery implements DbTransaction {
  constructor(
    connect: () => Promise<DbPoolConnection>,
    readonly mode?: TransactionMode,
  ) {
    super();
    this.#query = (sql: string) => {
      return new Promise<QueryRowsResult<any>>((resolve, reject) => {
        this.#pending = connect().then((conn) => {
          this.#conn = conn;
          const promise = conn.multipleQuery<[QueryRowsResult, QueryRowsResult]>(
            "BEGIN" + (this.mode ? " TRANSACTION ISOLATION LEVEL " + this.mode : "") + ";\n" + sql,
          );
          this.#pending = promise;
          this.#query = this.#queryAfter;
          return promise;
        }).then((res) => {
          this.#pending = undefined;
          resolve(res[1]);
        }, (e) => {
          this.#pending = undefined;
          reject(e);
          if (this.#conn) this.#release(this.#conn, e);
        });
      });
    };
  }
  #pending?: Promise<unknown>;
  #conn?: DbPoolConnection;
  async commit(): Promise<void> {
    if (this.#pending) throw new QueryNotCompletedError();
    if (this.#conn) {
      const promise = this.#conn.query("COMMIT");
      this.#release(this.#conn);
      await promise;
    }
  }
  async rollback(): Promise<void> {
    if (this.#pending) throw new QueryNotCompletedError();
    if (this.#conn) {
      const promise = this.#conn.query("ROLLBACK");
      this.#release(this.#conn);
      await promise;
    }
  }
  savePoint(savePoint: string): Promise<void> {
    return this.query("SAVEPOINT" + savePoint).then(() => {});
  }
  rollbackTo(savePoint: string): Promise<void> {
    return this.query("ROLLBACK TO " + savePoint).then(() => {});
  }

  /** 拿到连接后执行这个 */
  #queryAfter(sql: string) {
    return this.#conn!.query(sql).then((res) => {
      this.#pending = undefined;
      return res;
    }, (e) => {
      this.#pending = undefined;
      this.#release(this.#conn!, e);
      throw e;
    });
  }
  #query: (sql: string) => Promise<QueryRowsResult<any>>;
  override query<T extends object = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T extends object = any>(sql: { toString(): string }): Promise<QueryRowsResult<T>>;
  override query(sql: { toString(): string }): Promise<QueryRowsResult<any>> {
    if (this.#pending) return Promise.reject(new QueryNotCompletedError());
    return this.#query(sql.toString());
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: SqlStatementDataset<T>): Promise<T>;
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: { toString(): string }): Promise<T>;
  override multipleQuery(sql: { toString(): string }): Promise<MultipleQueryResult> {
    if (this.#pending) return Promise.reject(new QueryNotCompletedError());
    return this.#query(sql.toString()) as any;
  }
  #error: any;
  #release(conn: DbPoolConnection, error: any = new ConnectionNotAvailableError("Connection already release")) {
    this.#error = error;
    this.#query = () => Promise.reject(this.#error);
    this.#conn = undefined;
    conn.release();
  }
  get released() {
    return !!this.#error;
  }
  [Symbol.asyncDispose]() {
    return this.rollback();
  }
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
  idleCount: number;
  totalCount: number;
  begin(mode?: TransactionMode): DbTransaction;
  cursor<T extends {}>(sql: SqlStatementDataset<T>): Promise<DbCursor<T>>;
  cursor<T>(sql: { toString(): string }, option?: DbCursorOption): Promise<DbCursor<T>>;
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

/**
 * 池连接
 * @public
 */
export class DbPoolConnection extends DbQuery {
  constructor(conn: DbConnection, onRelease: () => void) {
    super();
    this.#conn = conn;
    this.#onRelease = onRelease;
  }
  #onRelease: () => void;
  //implement
  async begin(mode?: TransactionMode): Promise<void> {
    await this.query("BEGIN" + (mode ? " TRANSACTION ISOLATION LEVEL " + mode : ""));
  }
  #conn?: DbConnection;

  override query<T = any>(sql: SqlStatementDataset<T>): Promise<QueryRowsResult<T>>;
  override query<T = any>(sql: { toString(): string }): Promise<QueryRowsResult<T>>;
  override query(sql: { toString(): string }): Promise<QueryRowsResult> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    return this.#conn.query(sql);
  }
  override multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(sql: { toString(): string }): Promise<T> {
    if (!this.#conn) return Promise.reject(new ConnectionNotAvailableError("Connection already release"));
    return this.#conn.multipleQuery(sql);
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
    return !this.#conn;
  }
  /** 调用 release() 时，如果事务未提交，则抛出异常 */
  release() {
    if (this.#conn) {
      this.#conn = undefined;
      this.#onRelease();
    }
  }
  //implement
  [Symbol.dispose]() {
    return this.release();
  }
}

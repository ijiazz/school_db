import { SqlQueryStatement } from "@asla/yoursql";

/** @public */
export type QueryResult<T> = {
  rows: T[];
  rowCount: number | null;
};
/** @public */
export abstract class DbQuery {
  abstract createCursor<T extends object = any>(sql: SqlQueryStatement<T>): Promise<DbCursor<T>>;
  abstract createCursor<T extends object = any>(sql: { toString(): string }): Promise<DbCursor<T>>;
  abstract query<T extends object = any>(sql: SqlQueryStatement<T>): Promise<QueryResult<T>>;
  abstract query<T extends object = any>(sql: { toString(): string }): Promise<QueryResult<T>>;
  queryCount(sql: string | { toString(): string }): Promise<number> {
    return this.query(sql.toString()).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  queryRows<T extends object = any>(sql: SqlQueryStatement<T>): Promise<T[]>;
  queryRows<T extends object = any>(sql: { toString(): string }): Promise<T[]>;
  queryRows<T extends object = any>(sql: SqlQueryStatement<T> | string | { toString(): string }): Promise<T[]> {
    return this.query<T>(sql.toString()).then((res) => res.rows);
  }
}
/** @public */
export interface DbCursor<T> {
  /** 提前关闭游标 */
  close(): Promise<void>;
  /** 读取指定数量的行
   * 如果与迭代器混用，可能会造成顺序不一致问题 */
  read(number: number): Promise<T[]>;
  [Symbol.asyncIterator](): AsyncGenerator<T, undefined, undefined>;
  [Symbol.asyncDispose](): Promise<void>;
}

/** @public */
export interface DbTransactions extends DbQuery {
  rollback(): Promise<void>;
  commit(): Promise<void>;
  release(): void;
  /** 等价于 release() */
  [Symbol.dispose](): void;
}
/** @public */
export interface DbTransactionQuery extends DbQuery {
  /** 开启事务 */
  begin(mode?: "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" | "READ UNCOMMITTED"): Promise<DbTransactions>;
}
export interface DbClient extends DbTransactionQuery {
  [Symbol.asyncDispose](): Promise<void>;
  end(): Promise<void>;
}

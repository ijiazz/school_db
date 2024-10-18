import { SqlQueryStatement } from "@asla/yoursql";

/** @public */
export type QueryResult<T> = {
  rows: T[];
  rowCount: number | null;
};
/** @public */
export abstract class DbQuery {
  abstract query<T extends object = any>(
    sql: SqlQueryStatement<T> | string | { toString(): string }
  ): Promise<QueryResult<T>>;
  queryCount<T extends object = any>(sql: SqlQueryStatement<T> | string | { toString(): string }): Promise<number> {
    return this.query<T>(sql.toString()).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  queryRows<T extends object = any>(sql: SqlQueryStatement<T> | string | { toString(): string }): Promise<T[]> {
    return this.query<T>(sql.toString()).then((res) => res.rows);
  }
}

/** @public */
export interface DbTransactions extends DbQuery {
  rollback(): Promise<void>;
  commit(): Promise<void>;
  release(): void;
}
/** @public */
export interface DbTransactionQuery extends DbQuery {
  /** 开启事务 */
  begin(): Promise<DbTransactions>;
}
export interface DbClient extends DbTransactionQuery {
  end(): Promise<void>;
}

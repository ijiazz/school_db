import type { DbCursor, DbQueryPool, QueryRowsResult, SingleQueryResult } from "@asla/yoursql/client";

export interface DbConnectOption {
  database: string;
  user?: string;
  password?: string;
  hostname?: string;
  port?: number;
}

/**
 * 数据库连接池
 * @public
 */
export interface DbConnPool extends DbQueryPool, AsyncDisposable {
  /** 关闭所有链接。如果 force 为 true, 则直接断开所有连接，否则等待连接释放后再关闭 */
  close(force?: boolean): Promise<void>;
}

export interface ExecutableSql<T = unknown> {
  genSql(): string;
  then(resolve: (data: T) => void, reject: () => void): void;
}
export interface QueryableSql extends ExecutableSql<void> {
  query(): Promise<SingleQueryResult>;
  queryCount(): Promise<number>;
}
export interface QueryableDataSql<Raw, Res = QueryRowsResult<Raw>> extends ExecutableSql<Res> {
  query(): Promise<QueryRowsResult<Raw>>;
  queryCount(): Promise<number>;

  queryRows(): Promise<Raw[]>;
  queryFirstRow(): Promise<Raw>;
  queryMap<K>(key: string): Promise<Map<K, Raw>>;
  cursor(): Promise<DbCursor<Raw>>;
}

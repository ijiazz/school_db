import { pgSqlTransformer, SqlStatement, SqlStatementDataset, SqlValuesCreator } from "@asla/yoursql";
import type { DbCursor, QueryResult, QueryRowsResult } from "@asla/yoursql/client";
import { dbPool } from "./pg_client/mod.ts";

export const v = SqlValuesCreator.create(pgSqlTransformer);

export interface QueryableSql {
  query(): Promise<QueryResult>;
  queryCount(): Promise<number>;
}
export interface QueryableDataSql<T> extends QueryableSql {
  // query(): Promise<QueryRowsResult<T>>;
  queryRows(): Promise<T[]>;
  queryMap<K>(key: string): Promise<Map<K, T>>;
  cursor(): Promise<DbCursor<T>>;
}
declare module "@asla/yoursql" {
  interface SqlStatement extends QueryableSql {
  }
  interface SqlStatementDataset<T> extends QueryableDataSql<T> {
  }
}
const base: QueryableSql = {
  queryCount(): Promise<number> {
    return dbPool.queryCount(this.toString());
  },
  query(): Promise<QueryRowsResult<any>> {
    return dbPool.query<any>(this);
  },
};
const obj: QueryableDataSql<any> = {
  ...base,
  cursor(): Promise<DbCursor<any>> {
    return dbPool.cursor(this.toString());
  },
  queryMap<K>(key: string): Promise<Map<K, any>> {
    return dbPool.queryMap(this.toString(), key);
  },
  queryRows(): Promise<any[]> {
    return dbPool.queryRows(this.toString());
  },
};

Object.assign(SqlStatement.prototype, base);
Object.assign(SqlStatementDataset.prototype, obj);

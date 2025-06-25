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
  queryFirstRow(): Promise<T>;
  queryMap<K>(key: string): Promise<Map<K, T>>;
  cursor(): Promise<DbCursor<T>>;
}
declare module "@asla/yoursql" {
  interface SqlStatement extends QueryableSql {}
  interface SqlStatementDataset<T> extends QueryableDataSql<T> {}
}
const base: QueryableSql = {
  queryCount(this: SqlStatement): Promise<number> {
    return dbPool.queryCount(this.genSql());
  },
  query(this: SqlStatement): Promise<QueryRowsResult<any>> {
    return dbPool.query<any>(this.genSql());
  },
};
const obj: QueryableDataSql<any> = {
  ...base,
  cursor(this: SqlStatement): Promise<DbCursor<any>> {
    return dbPool.cursor(this.genSql());
  },
  queryFirstRow(this: SqlStatement): Promise<any> {
    return dbPool.queryFirstRow(this.genSql());
  },
  queryMap<K>(this: SqlStatement, key: string): Promise<Map<K, any>> {
    return dbPool.queryMap(this.genSql(), key);
  },
  queryRows(this: SqlStatement): Promise<any[]> {
    return dbPool.queryRows(this.genSql());
  },
};

Object.assign(SqlStatement.prototype, base);
Object.assign(SqlStatementDataset.prototype, obj);

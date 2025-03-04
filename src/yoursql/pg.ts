import { pgSqlTransformer, SqlStatement, SqlStatementDataset, SqlValuesCreator } from "@asla/yoursql";
import type { DbCursor, QueryResult, QueryRowsResult } from "./connect_abstract/mod.ts";
import { getDbPool } from "./pg_client/mod.ts";

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
    return getDbPool().queryCount(this.toString());
  },
  query(): Promise<QueryRowsResult<any>> {
    return getDbPool().query<any>(this);
  },
};
const obj: QueryableDataSql<any> = {
  ...base,
  cursor(): Promise<DbCursor<any>> {
    return getDbPool().cursor(this.toString());
  },
  queryMap<K>(key: string): Promise<Map<K, any>> {
    return getDbPool().queryMap(this.toString(), key);
  },
  queryRows(): Promise<any[]> {
    return getDbPool().queryRows(this.toString());
  },
};

Object.assign(SqlStatement.prototype, base);
Object.assign(SqlStatementDataset.prototype, obj);

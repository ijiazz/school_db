import { pgSqlTransformer, SqlStatementDataset, SqlValuesCreator } from "@asla/yoursql";
import type { DbCursor, QueryResult } from "./connect_abstract/mod.ts";
import { getDbPool } from "./pg_client/mod.ts";

export const v = SqlValuesCreator.create(pgSqlTransformer);

export interface QueryableSql<T> {
  query(): Promise<QueryResult<T>>;
  queryCount(): Promise<number>;
  queryRows(): Promise<T[]>;
  queryMap<K>(key: string): Promise<Map<K, T>>;
  cursor<T extends {}>(): DbCursor<T>;
}
declare module "@asla/yoursql" {
  interface SqlStatementDataset<T> extends QueryableSql<T> {
  }
}
const obj: QueryableSql<any> = {
  query(): Promise<QueryResult<any>> {
    return getDbPool().query<any>(this);
  },
  cursor(): DbCursor<any> {
    return getDbPool().cursor(this.toString());
  },
  queryCount(): Promise<number> {
    return getDbPool().queryCount(this.toString());
  },
  queryMap<K>(key: string): Promise<Map<K, any>> {
    return getDbPool().queryMap(this.toString(), key);
  },
  queryRows(): Promise<any[]> {
    return getDbPool().queryRows(this.toString());
  },
};

Object.assign(SqlStatementDataset.prototype, obj);

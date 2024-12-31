import { pgSqlTransformer, SqlStatementDataset, SqlValuesCreator } from "@asla/yoursql";
import type { DbCursor, QueryResult } from "./connect_abstract/mod.ts";
import { getDbPool } from "./pg_client/mod.ts";
import { PgPoolCursor } from "./pg_client/_pg_cursor.ts";

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
/** 扩展 SqlStatementDataset 类 */
abstract class PgQueryableSql<T extends Record<string, any>> implements QueryableSql<T> {
  query(): Promise<QueryResult<T>> {
    return getDbPool().query<T>(this);
  }
  cursor<T extends {}>(): DbCursor<T> {
    return new PgPoolCursor(this.toString(), function () {
      return getDbPool().connect();
    });
  }
  queryCount(): Promise<number> {
    return this.query().then((res) => res.rowCount ?? 0);
  }
  async queryMap<K>(key: string): Promise<Map<K, T>> {
    const { rows } = await this.query();
    let map = new Map<any, any>();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i][key], rows[i]);
    }
    return map;
  }
  queryRows(): Promise<T[]> {
    return this.query().then((res) => res.rows);
  }
}
Object.assign(SqlStatementDataset, PgQueryableSql.prototype);

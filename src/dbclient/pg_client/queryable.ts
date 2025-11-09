import { SqlStatement, SqlStatementDataset } from "@asla/yoursql";
import type { DbCursor, DbQueryPool, QueryRowsResult, SqlLike } from "@asla/yoursql/client";
import { dbPool } from "./mod.ts";
import type { QueryableDataSql, QueryableSql } from "./type.ts";

interface SqlStatementQueryClient {
  client(queryClient: DbQueryPool): QueryableSql;
}
interface SqlStatementDatasetClient<Raw> {
  dataClient(queryClient: DbQueryPool): QueryableDataSql<Raw>;
  dataClient<Res>(
    queryClient: DbQueryPool,
    transform: (data: QueryRowsResult<Raw>) => Res,
  ): QueryableDataSql<Raw, Res>;
}

declare module "@asla/yoursql" {
  interface SqlStatement extends SqlStatementQueryClient {
  }
  interface SqlStatementDataset<T> extends SqlStatementDatasetClient<T> {}
}
function createQueryableSqlPrototype<Raw, Res>(
  this: SqlStatementDataset<Raw>,
  queryClient: DbQueryPool,
  transform?: (data: QueryRowsResult<Raw>) => Res,
): QueryableDataSql<Raw, Res> {
  return new QueryableSqlImpl<Raw, Res>(queryClient, this, transform);
}
SqlStatementDataset.prototype.dataClient = createQueryableSqlPrototype;
SqlStatement.prototype.client = createQueryableSqlPrototype;

export function createQueryableSql(statement: SqlStatement | SqlLike): QueryableSql;
export function createQueryableSql<Raw>(
  statement: SqlStatementDataset<Raw> | SqlStatement | SqlLike,
): QueryableDataSql<Raw, void>;
export function createQueryableSql<Raw, Res>(
  statement: SqlStatementDataset<Raw> | SqlStatement | SqlLike,
  transform: (data: QueryRowsResult<Raw>) => Res,
): QueryableDataSql<Raw, Res>;
export function createQueryableSql<Raw>(
  statement: SqlStatement | SqlLike,
  transform?: (data: QueryRowsResult<Raw>) => any,
): QueryableDataSql<Raw, any> {
  return new QueryableSqlImpl<Raw>(dbPool, statement, transform);
}

class QueryableSqlImpl<Data, Res = QueryRowsResult<Data>> implements QueryableDataSql<Data, Res> {
  constructor(
    queryClient: DbQueryPool,
    statement: SqlStatement | SqlLike,
    transform?: (data: QueryRowsResult<Data>) => Res,
  );
  constructor(
    private queryClient: DbQueryPool,
    private statement: SqlStatement | SqlLike,
    private transform: (data: QueryRowsResult<Data>) => any = defaultTransform,
  ) {}
  genSql(): string {
    return this.statement.toString();
  }
  toString() {
    return this.genSql();
  }
  query(): Promise<QueryRowsResult<Data>> {
    return this.queryClient.query<Data>(this.statement);
  }
  queryCount(): Promise<number> {
    return this.queryClient.queryCount(this.statement);
  }
  queryRows(): Promise<Data[]> {
    return this.queryClient.queryRows(this.statement);
  }
  queryFirstRow(): Promise<Data> {
    return this.queryClient.queryFirstRow(this.statement);
  }
  queryMap<K>(key: string): Promise<Map<K, Data>> {
    return this.queryClient.queryMap<any>(this.statement, key);
  }
  cursor(): Promise<DbCursor<Data>> {
    return this.queryClient.cursor<any>(this.statement);
  }
  then(resolve: (data: Res) => void, reject: (error?: any) => void): void {
    this.queryClient.query<Data>(this.statement).then((data) => resolve(this.transform(data)), reject);
  }
}
function defaultTransform(): void {}

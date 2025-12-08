import {
  createDbPoolTransaction,
  DbCursor,
  DbPoolConnection,
  DbQueryPool,
  MultipleQueryInput,
  MultipleQueryResult,
  QueryInput,
  SqlLike,
} from "@asla/yoursql/client";
import { DbTransaction, TransactionMode } from "@asla/yoursql/client";
export type { ExecutableSQL } from "@asla/yoursql/client";

class InnDbPool extends DbQueryPool {
  close() {
    this.connect = defaultConnect;
  }
  connect: () => Promise<DbPoolConnection> = defaultConnect;
  override begin(mode?: TransactionMode): DbTransaction {
    return createDbPoolTransaction(this.connect, mode);
  }
  idleCount: number = 0;
  totalCount: number = 0;
  async query<T>(sql: QueryInput | MultipleQueryInput): Promise<T> {
    const conn = await this.connect();
    return conn.query(sql as QueryInput).finally(() => conn.release()) as Promise<T>;
  }
  async execute(sql: QueryInput | MultipleQueryInput): Promise<void> {
    const conn = await this.connect();
    return conn.execute(sql).finally(() => conn.release());
  }

  async multipleQuery<T extends MultipleQueryResult = MultipleQueryResult>(
    sql: SqlLike | SqlLike[],
  ): Promise<T> {
    const conn = await this.connect();
    return conn.multipleQuery(sql).finally(() => conn.release()) as Promise<T>;
  }
  override cursor<T extends object = any>(
    sql: SqlLike,
    option?: {},
  ): Promise<DbCursor<T>> {
    throw new Error("Method not implemented.");
  }
}
async function defaultConnect(): Promise<never> {
  throw new Error("Not connected");
}
export const dbPool: DbQueryPool = new InnDbPool();

export function setDbPoolConnect(connect: () => Promise<DbPoolConnection>) {
  dbPool.connect = connect;
}

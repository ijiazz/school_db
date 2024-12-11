import { SqlQueryStatement } from "@asla/yoursql";

/** @public */
export type QueryResult<T> = {
  rows: T[];
  rowCount: number | null;
};
/** @public */
export abstract class DbQuery {
  /**
   * 迭代游标返回的每一行
   * @param chunkSize 游标每次请求的行数
   */
  cursorEach<T extends {} = any>(sql: SqlQueryStatement<T>, chunkSize?: number): AsyncGenerator<T>;
  /**
   * 迭代游标返回的每一行
   * @param chunkSize 游标每次请求的行数
   */
  cursorEach<T extends {} = any>(sql: { toString(): string }, chunkSize?: number): AsyncGenerator<T>;
  async *cursorEach(sql: { toString(): string }, chunkSize: number = 10): AsyncGenerator<any> {
    for await (const row of this.cursorEachChunk(sql, chunkSize)) {
      yield* row;
    }
  }
  /**
   * 迭代游标
   * @param chunkSize 游标每次请求的行数
   */
  cursorEachChunk<T extends {} = any>(sql: SqlQueryStatement<T>, chunkSize: number): AsyncGenerator<T[]>;
  /**
   * 迭代游标
   * @param chunkSize 游标每次请求的行数
   */
  cursorEachChunk<T extends {} = any>(sql: { toString(): string }, chunkSize: number): AsyncGenerator<T[]>;
  async *cursorEachChunk<T extends {} = any>(sql: { toString(): string }, chunkSize: number): AsyncGenerator<T[]> {
    if (chunkSize <= 0) throw new Error("chunkSize 必须大于 0 ");
    const cursor = await this.createCursor(sql);
    try {
      let chunk = await cursor.read(chunkSize);
      while (chunk.length) {
        yield chunk;
        chunk = await cursor.read(chunkSize);
      }
    } finally {
      await cursor.close();
    }
  }
  /**
   * 创建游标
   */
  abstract createCursor<T extends object = any>(sql: SqlQueryStatement<T>): Promise<DbCursor<T>>;
  /**
   * 创建游标
   */
  abstract createCursor<T extends object = any>(sql: { toString(): string }): Promise<DbCursor<T>>;
  abstract query<T extends object = any>(sql: SqlQueryStatement<T>): Promise<QueryResult<T>>;
  abstract query<T extends object = any>(sql: { toString(): string }): Promise<QueryResult<T>>;
  /** 查询受影响的行 */
  queryCount(sql: string | { toString(): string }): Promise<number> {
    return this.query(sql.toString()).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  /** 查询行 */
  queryRows<T extends object = any>(sql: SqlQueryStatement<T>): Promise<T[]>;
  /** 查询行 */
  queryRows<T extends object = any>(sql: { toString(): string }): Promise<T[]>;
  queryRows<T extends object = any>(sql: SqlQueryStatement<T> | string | { toString(): string }): Promise<T[]> {
    return this.query<T>(sql.toString()).then((res) => res.rows);
  }
  queryMap<K, T extends object = any>(sql: SqlQueryStatement<T>, key: string): Promise<Map<K, T>>;
  queryMap<K, T extends object = any>(sql: { toString(): string }, key: string): Promise<Map<K, T>>;
  async queryMap(sql: SqlQueryStatement<any> | string | { toString(): string }, key: string): Promise<Map<any, any>> {
    const { rows } = await this.query(sql.toString());
    let map = new Map();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i][key], rows[i]);
    }
    return map;
  }
}
/** @public */
export interface DbCursor<T> {
  /** 提前关闭游标 */
  close(): Promise<void>;
  /** 读取指定数量的行
   * 如果与迭代器混用，可能会造成顺序不一致问题 */
  read(number: number): Promise<T[]>;
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

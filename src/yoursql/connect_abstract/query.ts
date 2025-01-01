import type { SqlStatementDataset } from "@asla/yoursql";

/** @public */
export type QueryResult<T> = {
  rows: T[];
  rowCount: number | null;
};
/**
 * SQL 查询相关操作
 * @public
 */
export abstract class DbQuery {
  abstract query<T = any>(sql: SqlStatementDataset<T>): Promise<QueryResult<T>>;
  abstract query<T = any>(sql: { toString(): string }): Promise<QueryResult<T>>;
  /** 查询受影响的行 */
  queryCount(sql: string | { toString(): string }): Promise<number> {
    return this.query(sql.toString()).then((res) => {
      if (res.rowCount === null) return 0;
      return res.rowCount;
    });
  }
  /** 查询行 */
  queryRows<T = any>(sql: SqlStatementDataset<T>): Promise<T[]>;
  /** 查询行 */
  queryRows<T = any>(sql: { toString(): string }): Promise<T[]>;
  queryRows<T = any>(sql: SqlStatementDataset<T> | string | { toString(): string }): Promise<T[]> {
    return this.query<T>(sql.toString()).then((res) => res.rows);
  }
  queryMap<K, T = any>(sql: SqlStatementDataset<T>, key: string): Promise<Map<K, T>>;
  queryMap<K, T = any>(sql: { toString(): string }, key: string): Promise<Map<K, T>>;
  async queryMap(sql: SqlStatementDataset<any> | string | { toString(): string }, key: string): Promise<Map<any, any>> {
    const { rows } = await this.query(sql.toString());
    let map = new Map();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i][key], rows[i]);
    }
    return map;
  }
}

/** @public */
export abstract class DbCursor<T> {
  abstract read(maxSize?: number): Promise<T[]>;
  abstract close(): Promise<void>;
  // implement
  [Symbol.asyncDispose]() {
    return this.close();
  }
  async *[Symbol.asyncIterator]() {
    let data = await this.read();
    while (data.length) {
      yield* data;
      data = await this.read();
    }
    this.close();
  }
}
/** @public */
export type TransactionMode = "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" | "READ UNCOMMITTED";

/**
 * SQL 事务查询操作
 *
 * 使用 using 语法避免忘记 rollback() 或者 commit() 造成连接池泄露
 *
 * ```ts
 * async function doSomeTransaction(){
 *    using transaction = pool.begin() // 离开作用域时，如果没有 commit() 或 rollback() 则抛出异常
 *    await transaction.query("SELECT * FROM user")
 * }
 * try{
 *    await doSomeTransaction()
 * }catch(e){
 *    console.error("事务没有提交！")
 * }
 *
 * async function doSomeTransaction2(){
 *    const transaction = pool.begin()
 *    await transaction.query("SELECT * FROM user")
 * }
 * await doSomeTransaction2() // 离开作用域后连接不会被回收
 * console.warn("连接未被回收！")
 *
 * ```
 * @public
 */
export interface DbTransaction extends DbQuery {
  /** 回滚，并释放连接 */
  rollback(): Promise<void>;
  /** 回滚到保存点 */
  rollbackTo(savePoint: string): Promise<void>;
  savePoint(savePoint: string): Promise<void>;
  /** 提交，并释放连接 */
  commit(): Promise<void>;
  [Symbol.dispose](): void;
}

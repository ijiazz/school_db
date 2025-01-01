import type { PoolClient } from "pg";
import Cursor from "pg-cursor";
import type { DbPoolConnection } from "../connect_abstract/mod.ts";
import { DbCursor } from "../connect_abstract/mod.ts";

class PgCursor<T> extends DbCursor<T> {
  constructor(cursor: Cursor<T>, conn: PoolClient) {
    super();
    this.#cursor = cursor;
    this.#conn = conn;
  }
  #conn?: PoolClient;
  #cursor: Cursor<T>;
  // implement
  read(maxSize: number = 20): Promise<T[]> {
    return this.#cursor.read(maxSize);
  }
  // implement
  close(): Promise<void> {
    this.#conn?.release();
    this.#conn = undefined;
    return this.#cursor.close();
  }
}
export class PgPoolCursor<T extends {}> extends DbCursor<T> {
  constructor(
    sql: string,
    connect: (cursor: Cursor) => Promise<DbPoolConnection>,
    readonly defaultChunkSize = 20,
  ) {
    super();
    this.#cursor = new Cursor(sql);
    this.#read = (maxSize: number) => {
      return new Promise<T[]>((resolve, reject) => {
        this.#waitConnect.push({ maxSize, reject, resolve });
        if (this.#waitConnect.length === 1) {
          this.#connect = connect(this.#cursor); //连接中

          this.#connect.then(async (conn) => {
            this.#connect = conn; // 已连接
            let item = this.#waitConnect.shift();
            while (item) {
              try {
                let res = await this.#cursor.read(item.maxSize);
                item.resolve(res);
              } catch (error) {
                item.reject(error);
              }
              item = this.#waitConnect.shift();
            }
            this.#waitConnect.length = 0;
            this.#read = this.#readAfterConnected;
          }, (e) => {
            for (const element of this.#waitConnect) {
              element.reject(e);
            }
            this.#waitConnect.length = 0;
          });
        }
      });
    };
  }

  #cursor: Cursor<T>;
  #connect?: DbPoolConnection | Promise<DbPoolConnection>;

  #waitConnect: { resolve(res: T[]): void; reject(e: any): void; maxSize: number }[] = [];

  #readAfterConnected(number: number) {
    return this.#cursor.read(number);
  }
  #read: (number: number) => Promise<T[]>;
  // implement
  read(maxSize: number = this.defaultChunkSize): Promise<T[]> {
    return this.#read(maxSize);
  }

  #closing?: Promise<void>;
  // implement
  async close(): Promise<void> {
    if (this.#connect) {
      this.#closing = this.#closeConn(this.#connect);
    }
    this.#read = () => Promise.resolve([]);
    return this.#closing;
  }
  async #closeConn(conn: Promise<DbPoolConnection> | DbPoolConnection) {
    // 获取过连接
    if (conn instanceof Promise) conn = await conn; // 等待
    await this.#cursor.close();
    conn.release();
  }
}

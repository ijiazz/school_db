import type Cursor from "pg-cursor";
import type { DbPoolConnection } from "../connect_abstract/mod.ts";
import { DbCursor, QueryNotCompletedError } from "../connect_abstract/mod.ts";

export class PgCursor<T> extends DbCursor<T> {
  constructor(cursor: Cursor<T>, conn: DbPoolConnection, readonly defaultChunkSize = 20) {
    super();
    this.#cursor = cursor;
    this.#conn = conn;
  }
  #conn?: DbPoolConnection;
  #cursor: Cursor<T>;
  #pending?: Promise<unknown>;
  // implement
  read(maxSize: number = this.defaultChunkSize): Promise<T[]> {
    if (this.#pending) return Promise.reject(new QueryNotCompletedError());
    const promise = this.#cursor.read(maxSize).finally(() => this.#pending = undefined);
    this.#pending = promise;
    return promise;
  }
  // implement
  close(): Promise<void> {
    this.#conn?.release();
    this.#conn = undefined;
    return this.#cursor.close();
  }
}

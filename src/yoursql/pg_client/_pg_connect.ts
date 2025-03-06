import type { Client } from "pg";
import { DbConnection, DbQuery, MultipleQueryResult, QueryRowsResult } from "@asla/yoursql/client";
import { addPgErrorInfo } from "./_error_handler.ts";

export class PgConnection extends DbQuery implements DbConnection {
  constructor(pool: Client) {
    super();
    this.#pool = pool;
  }
  close(): Promise<void> {
    return this.#pool.end();
  }

  #pool: Client;
  //implement
  override query<T extends object = any>(sql: ToString): Promise<QueryRowsResult<T>> {
    const text = sql.toString();
    return this.#pool.query<T>(text).catch((e) => addPgErrorInfo(e, text)) as any;
  }
  override multipleQuery<T extends MultipleQueryResult>(sql: ToString): Promise<T> {
    return this.query(sql) as any;
  }
  //implement
  [Symbol.asyncDispose]() {
    return this.close();
  }
}
type ToString = { toString(): string };

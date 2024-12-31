import type { Client } from "pg";
import { DbQuery } from "../connect_abstract/mod.ts";
import type { DbConnection, QueryResult } from "../connect_abstract/mod.ts";

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
  query<T extends object = any>(sql: ToString): Promise<QueryResult<T>> {
    return this.#pool.query<T>(sql.toString());
  }
  //implement
  [Symbol.asyncDispose]() {
    return this.close();
  }
}
type ToString = { toString(): string };

import type { Client } from "pg";

import {
  DbConnection,
  DbQuery,
  MultipleQueryResult,
  QueryRowsResult,
  SqlLike,
  sqlLikeToString,
} from "@asla/yoursql/client";
import { addPgErrorInfo } from "./_error_handler.ts";
import { createPgClient } from "./_pg_client.ts";
import type { DbConnectOption } from "./type.ts";

export class PgConnection extends DbQuery implements DbConnection {
  static async connect(url: string | URL | DbConnectOption) {
    let option: DbConnectOption;
    if (typeof url === "string" || url instanceof URL) option = parserDbUrl(url);
    else option = url;

    const pgClient = createPgClient(option);
    await pgClient.connect();
    return new PgConnection(pgClient);
  }
  constructor(pool: Client) {
    super();
    this.#pool = pool;
  }
  close(): Promise<void> {
    return this.#pool.end();
  }

  #pool: Client;
  //implement
  override query<T = any>(sql: SqlLike): Promise<QueryRowsResult<T>> {
    const text: string = sqlLikeToString(sql);
    return this.#pool.query(text).catch((e) => addPgErrorInfo(e, text)) as any;
  }
  override multipleQuery<T extends MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T> {
    if (sql instanceof Array) sql = sql.map(sqlLikeToString).join(";\n");
    return this.query(sql) as unknown as Promise<T>;
  }
  //implement
  [Symbol.asyncDispose]() {
    return this.close();
  }
}

export function createDbConnection(url: string | URL | DbConnectOption): Promise<DbConnection> {
  return PgConnection.connect(url);
}
export function parserDbUrl(url: URL | string): DbConnectOption {
  if (typeof url === "string") url = new URL(url);
  return {
    database: url.pathname.slice(1),
    hostname: url.hostname,
    port: +url.port,
    password: url.password ? url.password : undefined,
    user: url.username ? url.username : undefined,
  };
}

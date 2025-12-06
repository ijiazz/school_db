import type { Client } from "pg";

import {
  DbConnection,
  DbQuery,
  DbQueryBase,
  MultipleQueryInput,
  MultipleQueryResult,
  QueryDataInput,
  QueryInput,
  QueryRowsResult,
  SqlLike,
  sqlLikeToString,
} from "@asla/yoursql/client";
import { addPgErrorInfo } from "./_error_handler.ts";
import { createPgClient } from "./_pg_client.ts";
import type { DbConnectOption } from "./type.ts";

export class PgConnection extends DbQuery implements DbConnection, DbQueryBase {
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

  override query<T extends MultipleQueryResult = MultipleQueryResult>(sql: MultipleQueryInput): Promise<T>;
  override query<T = any>(sql: QueryDataInput<T>): Promise<QueryRowsResult<T>>;
  override query<T = any>(sql: QueryInput): Promise<QueryRowsResult<T>>;
  override query<T = any>(sql: SqlLike[] | SqlLike): Promise<unknown[] | unknown>;
  override query<T = any>(input: QueryInput | MultipleQueryInput): Promise<T> {
    const text = genSql(input);
    return this.#pool.query(text).catch((e) => addPgErrorInfo(e, text)) as any;
  }
  override execute(input: QueryInput | MultipleQueryInput): Promise<void> {
    const text = genSql(input);
    return this.#pool.query(text).then(() => {}, (e) => addPgErrorInfo(e, text)) as any;
  }
  override multipleQuery<T extends MultipleQueryResult>(sql: SqlLike | SqlLike[]): Promise<T> {
    if (sql instanceof Array) sql = sql.map(sqlLikeToString).join(";\n");
    else sql = sqlLikeToString(sql);
    return this.#pool.query(sql) as unknown as Promise<T>;
  }
  //implement
  [Symbol.asyncDispose]() {
    return this.close();
  }
}

export function genSql(input: QueryInput | MultipleQueryInput) {
  if (typeof input === "function") {
    input = input();
  }
  if (input instanceof Array) {
    return input.map(sqlLikeToString).join(";\n");
  } else {
    return sqlLikeToString(input);
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

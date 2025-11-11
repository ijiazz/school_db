import pg, { Client } from "pg";
import type { DbConnectOption } from "./type.ts";

export function createPgClient(c: DbConnectOption): Client {
  return new pg.Client({
    database: c.database,
    host: c.hostname,
    port: c.port,
    user: c.user,
    password: c.password,
  });
}

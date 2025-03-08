import pg from "pg";

import { ENV } from "../../common/env.ts";
import { PgDbPool } from "./_pg_pool.ts";
const pgTypes = pg.types;

pgTypes.setTypeParser(pgTypes.builtins.INT8, BigInt);

export * from "./type.ts";
export * from "./pg_connect.ts";

const DB_URL = ENV.DATABASE_URL ?? "postgresql://postgres@localhost:5432/ijia_test";
export const dbPool = new PgDbPool(DB_URL);
if (!ENV.DATABASE_URL) dbPool.connectWarning = `缺少 OOS_ROOT_DIR 环境变量，将使用默认值 ${DB_URL}`;

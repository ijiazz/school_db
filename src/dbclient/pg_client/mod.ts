import pg from "pg";

import { ENV } from "../../common/env.ts";
import { PgDbPool } from "./_pg_pool.ts";
const pgTypes = pg.types;

pgTypes.setTypeParser(pgTypes.builtins.INT8, BigInt);

export * from "./type.ts";
export * from "./pg_connect.ts";
export * from "./queryable.ts"; // 副作用模块

export const dbPool = new PgDbPool(() => {
  let url = ENV.DATABASE_URL;
  if (!url) {
    url = "postgresql://postgres@localhost:5432/ijia_test";
    console.warn("未配置 DATABASE_URL环境变量, 将使用默认值：" + url);
  }
  return url;
});

import { PgDbQueryPool } from "@asla/pg";
import { ENV } from "./common/env.ts";
export type { ExecutableSQL } from "@asla/yoursql/client";

export const dbPool = new PgDbQueryPool(() => {
  let url = ENV.DATABASE_URL;
  if (!url) {
    url = "postgresql://postgres@localhost:5432/ijia_test";
    console.warn("未配置 DATABASE_URL环境变量, 将使用默认值：" + url);
  }
  return url;
});

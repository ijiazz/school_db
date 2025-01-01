/** 需要却包 PostgreSQL 已启动 */

import type { GlobalSetupContext } from "vitest/node";
import { createInitIjiaDb, DbManage } from "@ijia/data/testlib.ts";
import { createPgClient, parserDbUrl } from "@ijia/data/yoursql.ts";
let env: ReturnType<typeof getConfigEnv>;

export async function setup({ config, provide }: GlobalSetupContext) {
  console.log("Setup PgSQL");

  env = getConfigEnv(config.env);
  const username = env.adminConnectConfig.user;
  if (!username) throw new Error("TEST_LOGIN_DB 缺少 username");
  const connect = env.adminConnectConfig;
  await createInitIjiaDb(connect, env.ijiaTemplateName, {
    dropIfExists: true,
  });
}
export async function teardown() {
  await using admin = new DbManage(await createPgClient(env.adminConnectConfig));
  await admin.dropDb(env.ijiaTemplateName);
}
function getConfigEnv(env: Record<string, string | undefined>) {
  const url = env["TEST_LOGIN_DB"];
  if (!url) throw new Error("缺少 TEST_LOGIN_DB 环境变量");
  const ijiaTemplateName = env.IJIA_TEMPLATE_DBNAME;
  if (!ijiaTemplateName) throw new Error("缺少 IJIA_TEMPLATE_DBNAME 环境变量");

  const adminConnectConfig = parserDbUrl(url);

  return { adminConnectConfig, ijiaTemplateName };
}

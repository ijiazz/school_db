import { test } from "../../fixtures/db_connect.ts";
import process from "node:process";
import { getMergedFiles } from "@ijia/data/testlib";
const isCi = !!process.env.CI;

test.skipIf(!isCi)("使用 shell 初始化数据库", async function ({ emptyDbPool }) {
  const initSql = await getMergedFiles();
  await emptyDbPool.multipleQuery(initSql);
});

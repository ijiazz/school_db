import { test as viTest } from "vitest";
import { createPgPool, DbPool, parserDbUrl, setDbPool } from "@ijia/data/yoursql";
import { createInitIjiaDb, DbManage } from "@ijia/data/testlib";
import process from "node:process";
export interface BaseContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbPool;
  emptyDbPool: DbPool;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const DB_NAME_PREFIX = "test_ijia_";
const DB_CONNECT_INFO = getConfigEnv(process.env);

export const test = viTest.extend<BaseContext>({
  async ijiaDbPool({}, use) {
    const dbName = DB_NAME_PREFIX + VITEST_WORKER_ID;
    await createInitIjiaDb(DB_CONNECT_INFO, dbName, { dropIfExists: true, extra: true });
    const dbPool = await createPgPool({ ...DB_CONNECT_INFO, database: dbName });
    setDbPool(dbPool);
    await use(dbPool);
    const useCount = dbPool.totalCount - dbPool.idleCount;
    await dbPool.close(true);

    await clearDropDb(dbName);
    if (useCount !== 0) throw new Error("存在未释放的连接");
  },
  async emptyDbPool({}, use) {
    const dbName = "test_empty_" + VITEST_WORKER_ID;

    const manage = await getManage();
    await manage.emptyDatabase(dbName);
    await manage.close();

    const dbPool = await createPgPool({ ...DB_CONNECT_INFO, database: dbName });
    await use(dbPool);
    const useCount = dbPool.totalCount - dbPool.idleCount;
    await dbPool.close(true);

    await clearDropDb(dbName);
    if (useCount !== 0) throw new Error("存在未释放的连接");
  },
});
function getConfigEnv(env: Record<string, string | undefined>) {
  const url = env["TEST_LOGIN_DB"];
  if (!url) throw new Error("缺少 TEST_LOGIN_DB 环境变量");
  return parserDbUrl(url);
}
async function clearDropDb(dbName: string) {
  try {
    const manage = await getManage();
    await manage.dropDb(dbName);
    await manage.close();
  } catch (error) {
    console.error(`清理用于测试的数据库 ${dbName} 失败`, error);
  }
}

function getManage() {
  return DbManage.connect(DB_CONNECT_INFO);
}

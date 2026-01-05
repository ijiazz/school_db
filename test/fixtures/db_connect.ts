import { afterAll, test as viTest } from "vitest";
import { dbPool, setDbPoolConnect } from "@/common/dbclient.ts";
import { createInitIjiaDb } from "@ijia/data/testlib";
import process from "node:process";
import { DbManage, DbQueryPool, parserDbConnectUrl, PgDbQueryPool } from "@asla/pg";
export interface BaseContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbQueryPool;
  publicDbPool: DbQueryPool;
  emptyDbPool: DbQueryPool;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const DB_NAME = `test_${VITEST_WORKER_ID}`;
const DB_NAME_IJIA = DB_NAME + "_ijia";
const DB_NAME_IJIA_PUB = DB_NAME_IJIA + "_pub";

const DB_CONNECT_INFO = getConfigEnv(process.env);

let publicDbPool: Promise<PgDbQueryPool> | PgDbQueryPool | undefined;

afterAll(async function () {
  if (publicDbPool) {
    const pool = await publicDbPool;
    await clearDropDb(pool, DB_NAME_IJIA_PUB);
  }
});

export const test = viTest.extend<BaseContext>({
  async emptyDbPool({}, use) {
    const manage = await DbManage.connect(DB_CONNECT_INFO);
    try {
      await manage.createDb(DB_NAME);
    } finally {
      await manage.close();
    }

    const pool = new PgDbQueryPool({ ...DB_CONNECT_INFO, database: DB_NAME });
    await use(pool);
    await clearDropDb(pool, DB_NAME);
  },
  async ijiaDbPool({}, use) {
    const dbName = DB_NAME_IJIA;
    await createInitIjiaDb(DB_CONNECT_INFO, dbName, { dropIfExists: true });

    const pool = new PgDbQueryPool({ ...DB_CONNECT_INFO, database: dbName });
    setDbPoolConnect(pool.connect.bind(pool));

    await use(dbPool);

    await clearDropDb(pool, dbName);
  },
  async publicDbPool({}, use) {
    const dbName = DB_NAME_IJIA_PUB;
    if (!publicDbPool) {
      publicDbPool = (async () => {
        await createInitIjiaDb(DB_CONNECT_INFO, dbName, { dropIfExists: true });
        const pool = new PgDbQueryPool({ ...DB_CONNECT_INFO, database: dbName });
        pool.open();
        publicDbPool = pool;
        return pool;
      })();
    }
    const pool = await publicDbPool;
    pool.open();
    setDbPoolConnect(pool.connect.bind(pool));

    await use(dbPool);
  },
});
function getConfigEnv(env: Record<string, string | undefined>) {
  const url = env["TEST_LOGIN_DB"];
  if (!url) throw new Error("缺少 TEST_LOGIN_DB 环境变量");
  return parserDbConnectUrl(url);
}
async function clearDropDb(pool: PgDbQueryPool, dbName: string) {
  await pool.close(true);
  const useCount = pool.totalCount - pool.idleCount;
  try {
    const manage = await getManage();
    await manage.dropDb(dbName);
    await manage.close();
  } catch (error) {
    console.error(`清理用于测试的数据库 ${dbName} 失败`, error);
  }
  if (useCount !== 0) throw new Error("存在未释放的数据库连接");
}

function getManage() {
  return DbManage.connect(DB_CONNECT_INFO);
}

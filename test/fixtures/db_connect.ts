import { test as viTest } from "vitest";
import { dbPool, setDbPoolConnect } from "@/common/dbclient.ts";
import { createInitIjiaDb } from "@ijia/school-db/testlib";
import process from "node:process";
import { DbManage, DbQueryPool, PgDbQueryPool } from "@asla/pg";
import { DB_CONNECT_INFO, PUBLIC_CONNECT_INFO } from "@test/utils/db.ts";

export interface BaseContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbQueryPool;
  publicDbPool: DbQueryPool;
  emptyDbPool: DbQueryPool;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;

export const test = viTest.extend<BaseContext>({
  async emptyDbPool({}, use) {
    const DB_NAME = "test_empty_" + VITEST_WORKER_ID;
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
    const DB_NAME = "test_ijia_" + VITEST_WORKER_ID;
    await createInitIjiaDb(DB_CONNECT_INFO, DB_NAME, { dropIfExists: true });

    const pool = new PgDbQueryPool({ ...DB_CONNECT_INFO, database: DB_NAME });
    setDbPoolConnect(pool.connect.bind(pool));

    await use(dbPool);

    await clearDropDb(pool, DB_NAME);
  },
  async publicDbPool({}, use) {
    const pool = new PgDbQueryPool(PUBLIC_CONNECT_INFO);
    setDbPoolConnect(pool.connect.bind(pool));
    await use(pool);
    await pool.close();
  },
});

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

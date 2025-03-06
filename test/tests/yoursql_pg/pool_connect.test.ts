import { expect } from "vitest";
import { test } from "../../fixtures/db_connect.ts";
import { ConnectionNotAvailableError, DbQuery, QueryRowsResult } from "@asla/yoursql/client";
async function createTable(query: DbQuery, rowNum: number) {
  await query.query(
    `CREATE TABLE test(id INT PRIMARY KEY, num INT); INSERT INTO test(id) SELECT generate_series(0,${rowNum})`,
  );
}
const rowNum = 200;
const values: { id: number; num: number | null }[] = new Array(rowNum);
for (let i = 0; i < 200; i++) {
  values[i] = { id: i, num: null };
}
test("多条 SQL 语句", async function ({ emptyDbPool }) {
  await createTable(emptyDbPool, 10);
  const result = await emptyDbPool.multipleQueryRows("SELECT * FROM test limit 2; SELECT * from test limit 1");
  expect(result).instanceof(Array);
  expect(result.length).toBe(2);
});

test(
  "使用 using 在离开作用域时未提交或回滚事务，则自动回滚，并释放连接",
  async function ({ emptyDbPool }) {
    await createTable(emptyDbPool, 200);
    async function start() {
      await using conn = emptyDbPool.begin();
      await conn.query("UPDATE test set num=8 WHERE id=0");
    }
    await start();
    const result = await emptyDbPool.queryMap<{ id: number; num: number | null }>(
      "SELECT * from test WHERE id=1",
      "id",
    );
    await expect(result.get(1)?.num).toBe(null);
    expect(emptyDbPool.idleCount, "游标所在连接已被释放").toBe(1);
  },
);
test("执行第一条语句时，才开始建立连接", async function ({ emptyDbPool }) {
  expect(emptyDbPool.totalCount).toBe(emptyDbPool.idleCount);
  const transaction = emptyDbPool.begin();
  expect(emptyDbPool.totalCount, "没有获取连接").toBe(emptyDbPool.idleCount);
  await transaction.query("CREATE TABLE test (id INT)");
  expect(emptyDbPool.totalCount - emptyDbPool.idleCount, "连接被建立").toBe(1);

  await expect(transaction.commit()).resolves.toBeUndefined();
  expect(emptyDbPool.totalCount, "连接被释放").toBe(emptyDbPool.idleCount);
});
test("开始事务，并提交事务", async function ({ emptyDbPool }) {
  await createTable(emptyDbPool, 10);
  async function start() {
    await using conn = emptyDbPool.begin();
    const result = await conn.query<QueryRowsResult<any>>("UPDATE test set num=8 WHERE id=1 RETURNING *");
    await conn.commit();
    return result.rows[0];
  }
  await start();
  const result = await emptyDbPool.queryMap<{ id: number; num: number | null }>(
    "SELECT * from test WHERE id=1",
    "id",
  );
  await expect(result.get(1)?.num).toBe(8);
});

test("未进行任何操作，释放连接", async function ({ emptyDbPool }) {
  const conn = await emptyDbPool.connect();
  expect(emptyDbPool.idleCount).toBe(0);
  expect(emptyDbPool.totalCount).toBe(1);
  conn.release();
  expect(emptyDbPool.totalCount).toBe(1);
  expect(emptyDbPool.idleCount).toBe(1);
});

test("执行出错，继续执行", async function ({ emptyDbPool }) {
  const conn = await emptyDbPool.connect();
  await expect(conn.query("xxx")).rejects.toThrowError();
  expect(emptyDbPool.totalCount).toBe(1);
  expect(emptyDbPool.idleCount, "连接未被释放").toBe(0);
  await conn.query("CREATE TABLE abc (id INT)");
  conn.release();
  expect(emptyDbPool.idleCount, "连接已被释放").toBe(1);
});
test("释放连接后试图继续执行查询", async function ({ emptyDbPool }) {
  const conn = await emptyDbPool.connect();
  conn.release();
  await expect(conn.query("CREATE TABLE abc (id INT)"), "release() 继续调用 query() ，应抛出异常").rejects
    .toThrowError(ConnectionNotAvailableError);
});
test("事务中通出错，应释放连接", async function ({ emptyDbPool }) {
  const transaction = emptyDbPool.begin();
  await expect(transaction.query("aaa")).rejects.toThrowError();
  expect(emptyDbPool.idleCount).toBe(1);
});

test("执行出错，试图再次 rollback", async function ({ emptyDbPool }) {
  async function start() {
    const conn = emptyDbPool.begin();
    try {
      await conn.query("aaa"); // 执行出错
    } catch (error) {
      await conn.rollback(); // rollback()
    }
  }
  await expect(start()).resolves.toBeUndefined();
});

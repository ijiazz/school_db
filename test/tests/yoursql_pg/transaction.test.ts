import { DbQuery } from "@ijia/data/yoursql.ts";
import { beforeEach, expect } from "vitest";

import { BaseContext, test } from "../../fixtures/db_connect.ts";
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
beforeEach<BaseContext>(async ({ emptyDbPool }) => {
  await createTable(emptyDbPool, 200);
});

test(
  "使用 using 在离开作用域时未提交或回滚事务，应回滚并抛出异常",
  async function ({ emptyDbPool }) {
    async function start() {
      await using conn = emptyDbPool.begin();
      await conn.query("UPDATE test set num=8 WHERE id=0");
    }
    await start();
    const result = await emptyDbPool.queryMap<number, { id: number; num: number | null }>(
      "SELECT * from test WHERE id=1",
      "id",
    );
    await expect(result.get(1)?.num).toBe(null);
    expect(emptyDbPool.idleCount, "游标所在连接已被释放").toBe(1);
  },
);
test("开始事务，并提交事务", async function ({ emptyDbPool }) {
  async function start() {
    await using conn = emptyDbPool.begin();
    await conn.query("UPDATE test set num=8 WHERE id=1");
    await conn.commit();
  }
  await start();
  const result = await emptyDbPool.queryMap<number, { id: number; num: number | null }>(
    "SELECT * from test WHERE id=1",
    "id",
  );
  await expect(result.get(1)?.num).toBe(8);
});

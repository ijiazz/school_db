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

test("通过异步迭代器读取所有数据", async function ({ emptyDbPool }) {
  const result = await Array.fromAsync(emptyDbPool.cursor("SELECT * FROM test LIMIT 20", { defaultSize: 5 }));
  expect(result, "异步迭代器").toEqual(values.slice(0, 20));
});
test("使用 await using 读取", async function ({ emptyDbPool }) {
  async function usingRed() {
    await using cursor = emptyDbPool.cursor("SELECT * FROM test LIMIT 20", { defaultSize: 5 });
    return cursor.read();
  }

  await expect(usingRed()).resolves.toEqual(values.slice(0, 5));
});
test("并行", async function ({ emptyDbPool }) {
  const cursor = emptyDbPool.cursor("SELECT * FROM test LIMIT 20", { defaultSize: 5 });
  let p1 = cursor.read(5);
  let p2 = cursor.read(5);
  await expect(p1).resolves.toEqual(values.slice(0, 5));
  await expect(p2, "连接中读取").resolves.toEqual(values.slice(5, 10));

  let c0 = cursor.close();
  let p3 = cursor.read(5);
  await expect(c0, "连接中关闭").resolves.toBeUndefined();
  await expect(p3, "关闭后读取").resolves.toEqual([]);
});
test("未提交", async function ({ emptyDbPool }) {
  async function forgotCommit() {
    using conn = emptyDbPool.begin();
    await conn.query("UPDATE test set num=8 WHERE id=0");
  }
  await expect(forgotCommit()).rejects.toThrowError();

  async function commit() {
    using conn = emptyDbPool.begin();
    await conn.query("UPDATE test set num=8 WHERE id=1");
    await conn.commit();
  }

  await expect(commit()).resolves.not.toThrowError();
});

import { expect } from "vitest";
import { test } from "./__mock.ts";

test("count", async function ({ pool }) {
  expect(pool.totalCount).toBe(0);
  expect(pool.idleCount).toBe(0);
  const conn = await pool.connect();
  expect(pool.totalCount).toBe(1);
  expect(pool.idleCount).toBe(0);

  const conn2 = await pool.connect();
  expect(pool.totalCount).toBe(2);
  expect(pool.idleCount).toBe(0);

  pool.release(conn);
  expect(pool.totalCount).toBe(2);
  expect(pool.idleCount).toBe(1);

  pool.release(conn);
  expect(pool.totalCount).toBe(2);
  expect(pool.idleCount).toBe(2);
});
test("count", async function ({ pool }) {
  const conn = await pool.connect();
  expect(pool.totalCount).toBe(1);
  expect(pool.idleCount).toBe(0);
  expect(pool.waitingCount).toBe(0);
  pool.release(conn);

  expect(pool.totalCount).toBe(1);
  expect(pool.idleCount).toBe(1);
  expect(pool.waitingCount).toBe(0);
});

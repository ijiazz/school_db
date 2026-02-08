import { dbPool } from "@/common/dbclient.ts";
import { test } from "../../fixtures/db_connect.ts";
import { insertIntoValues, v } from "@/common/sql.ts";
import { expect } from "vitest";
import { createDbFunction, type DbReviewCreate, ReviewTargetType } from "@ijia/data/db";
import { createTempTestUser } from "@/testlib/create_user.ts";

const f = createDbFunction(dbPool, v);

test("review_commit", async function ({ publicDbPool }) {
  const id = await createReviewRecord(ReviewTargetType.post);
  const { user_id: u1 } = await createTempTestUser();
  const { user_id: u2 } = await createTempTestUser();
  const { user_id: u3 } = await createTempTestUser();

  const f1 = await f.review_commit(id, u1, true, null);
  expect(f1).toBe(1);

  await expect(f.review_commit(id, u1, true, null), "同一个用户不能重复提交审核").rejects.toThrowError();
  const f3 = await f.review_commit(id, u2, true, null);
  expect(f3).toBe(2);

  const res = await publicDbPool.queryFirstRow(`SELECT pass_count, reject_count FROM review WHERE id = ${id}`);
  console.log(res);

  const f4 = await f.review_commit(id, u3, false, null);
  expect(f4).toBe(1);
});

function createReviewRecord(type: ReviewTargetType) {
  const sq = insertIntoValues("review", { target_type: type, info: {} } satisfies DbReviewCreate).returning("id");
  return dbPool.createQueryableSQL(
    sq,
    (queryable, sql) => queryable.queryFirstRow<{ id: number }>(sql).then((r) => r!.id),
  );
}

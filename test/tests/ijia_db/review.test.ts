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

test("review_insert_record_check_old", async function ({ publicDbPool }) {
  const id = await createReviewRecord(ReviewTargetType.post);
  {
    const reviewId = await f.review_insert_record_check_old(id, ReviewTargetType.post, null, null);
    await expect(publicDbPool.queryCount(`SELECT id FROM review WHERE id = ${id}`), "原 ID 应被删除").resolves
      .toBe(0);
    await expect(reviewId, "传了 ID 应返回新的 ID").not.toBe(id);
  }
  {
    const reviewId = await f.review_insert_record_check_old(null, ReviewTargetType.post, null, null);
    await expect(reviewId, "没传 ID 应创建后返回新 ID").not.toBe(id);
    expect(reviewId).toBeTypeOf("number");
  }
});

function createReviewRecord(type: ReviewTargetType) {
  const sq = insertIntoValues(
    "review",
    { target_type: type } satisfies DbReviewCreate,
  ).returning("id");
  return dbPool.createQueryableSQL(
    sq,
    (queryable, sql) => queryable.queryFirstRow<{ id: number }>(sql).then((r) => r!.id),
  );
}

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

  await expect(f.review_commit(id, u1, true)).resolves.toBe(1);
  await expect(f.review_commit(id, u1, true), "同一个用户不能重复提交审核").rejects.toThrowError();
  await expect(f.review_commit(id, u2, true)).resolves.toBe(2);
  await expect(f.review_commit(id, u3, true)).resolves.toBe(1);
});

test("review_insert_record_check_old", async function ({ publicDbPool }) {
  const id = await createReviewRecord(ReviewTargetType.post);

  await expect(f.review_insert_record_check_old(id, ReviewTargetType.post), "传了 ID 应返回原始 ID")
    .resolves
    .toBe(id);
  await expect(f.review_insert_record_check_old(null, ReviewTargetType.post), "没传 ID 应创建后返回新 ID").resolves.not
    .toBe(id);
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

import { DbUserAvatar, user, user_avatar } from "@ijia/data/db";
import { expect } from "vitest";
import { test } from "../../fixtures/db_connect.ts";

test("创建或修改 user 表，会触发数据库触发器并自动更新用户头像引用计数", async function ({ ijiaDbPool }) {
  await addUserAvatar(["a", "b"]);

  await expect(getAvatar()).resolves.toMatchObject({ a: 0, b: 0 });

  await createUser("u0", "b"); // b+1
  await createUser("u1", "a"); // a+1

  await expect(getAvatar()).resolves.toMatchObject({ a: 1, b: 1 });

  await ijiaDbPool.query(user.delete({ where: "email='u0'" })); //b-1

  await expect(getAvatar()).resolves.toMatchObject({ a: 1, b: 0 });

  await ijiaDbPool.query(user.updateFrom({ avatar: "b" }).where("email='u1'")); // b+1, a-1
  await expect(getAvatar()).resolves.toMatchObject({ a: 0, b: 1 });
});

async function getAvatar(): Promise<Record<string, number>> {
  const res = await user_avatar.select<Pick<DbUserAvatar, "id" | "ref_count">>({ id: true, ref_count: true })
    .queryRows();

  return res.reduce(
    (i, c) => {
      i[c.id] = c.ref_count;
      return i;
    },
    {} as Record<string, number>,
  );
}
async function createUser(email: string, avatarId: string) {
  await user.insert({ email, avatar: avatarId }).query();
}
async function addUserAvatar(uri: string[]) {
  await user_avatar.insert(uri.map((uri) => ({ id: uri, size: 1 }))).query();
}

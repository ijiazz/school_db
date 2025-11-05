import { comment_image, DbUserAvatar, pla_asset, pla_comment, pla_user, Platform, user_avatar } from "@ijia/data/db";
import { dbPool, v } from "@ijia/data/yoursql";
import { expect } from "vitest";
import { test } from "../../fixtures/db_connect.ts";

test("创建或修改用户表，会触发数据库触发器并自动更新用户头像引用计数", async function ({ ijiaDbPool }) {
  await addUserAvatar(["a", "b"]);

  await expect(getAvatar()).resolves.toMatchObject({ a: 0, b: 0 });

  await addUser("u0", "b"); // b+1
  await addUser("u1", "a"); // a+1

  await expect(getAvatar()).resolves.toMatchObject({ a: 1, b: 1 });

  await ijiaDbPool.query(pla_user.delete({ where: "pla_uid='u0'" })); //b-1

  await expect(getAvatar()).resolves.toMatchObject({ a: 1, b: 0 });

  await ijiaDbPool.query(pla_user.updateFrom({ avatar: "b" }).where("pla_uid='u1'")); // b+1, a-1
  await expect(getAvatar()).resolves.toMatchObject({ a: 0, b: 1 });
});
test("创建或修改作品表，会触发数据库触发器并自动更新用户头像引用计数", async function ({ ijiaDbPool }) {
  await addUserAvatar(["a", "b"]);
  await addUser("u0", "a");

  await addAsset("u0", "p0", "a");
  await expect(getAvatar()).resolves.toMatchObject({ a: 2, b: 0 });

  await ijiaDbPool.query(pla_asset.delete({ where: "asset_id='p0'" }));
  await expect(getAvatar()).resolves.toMatchObject({ a: 1, b: 0 });
});
test("创建或修改评论表，会触发数据库触发器并自动更新用户头像引用计数", async function ({ ijiaDbPool }) {
  await addUserAvatar(["a"]);
  await addUser("u0", "a");
  await addAsset("u0", "p0", "a");

  await addCommentImage(["b", "c"]);
  await addComment({ uid: "u0", pid: "p0", cid: "c0" }, "b");

  await expect(getAvatar()).resolves.toMatchObject({ a: 2 });
  await expect(getCommentImage()).resolves.toMatchObject({ b: 1, c: 0 });

  await ijiaDbPool.query(pla_comment.updateFrom({ additional_image: "c" }));
  await expect(getCommentImage()).resolves.toMatchObject({ b: 0, c: 1 });

  await ijiaDbPool.query(pla_comment.delete({ where: "asset_id='p0'" }));

  await expect(getAvatar()).resolves.toMatchObject({ a: 2 });
  await expect(getCommentImage()).resolves.toMatchObject({ b: 0, c: 0 });
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
async function getCommentImage(): Promise<Record<string, number>> {
  const res = await comment_image.select<Pick<DbUserAvatar, "id" | "ref_count">>({ id: true, ref_count: true })
    .queryRows();
  return res.reduce(
    (i, c) => {
      i[c.id] = c.ref_count;
      return i;
    },
    {} as Record<string, number>,
  );
}
async function addUser(uid: string, avatar: string) {
  await pla_user.insert({ pla_uid: uid, platform: Platform.douYin, avatar }).query();
}
async function addUserAvatar(uri: string[]) {
  await user_avatar.insert(uri.map((uri) => ({ id: uri, size: 1 }))).query();
}
async function addCommentImage(uri: string[]) {
  await comment_image.insert(uri.map((uri) => ({ id: uri, size: 1 }))).query();
}
async function addAsset(uid: string, pid: string, user_avatar_snapshot: string) {
  await pla_asset.insert({ pla_uid: uid, platform: Platform.douYin, asset_id: pid }).query();
  await pla_asset.updateFrom({ user_avatar_snapshot }).where("asset_id=" + v(pid)).query();
}

async function addComment(
  id: { uid: string; pid: string; cid: string },
  commentImg?: string,
) {
  let q = pla_comment.insert({
    pla_uid: id.uid,
    platform: Platform.douYin,
    asset_id: id.pid,
    comment_id: id.cid,
    additional_image: commentImg,
  });
  await dbPool.query(q);
}

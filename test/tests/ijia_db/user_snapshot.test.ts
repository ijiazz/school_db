import { BaseContext as Context, test } from "../../fixtures/db_connect.ts";
import { beforeEach, expect } from "vitest";
import {
  DbPlaAssetCreate,
  DbPlaUserCreate,
  DbUserAvatarCreate,
  pla_asset,
  pla_comment,
  Platform,
  user_avatar,
} from "@ijia/data/db.ts";
import { savePlaAssetList, savePlaCommentList, savePlaUserList } from "@ijia/data/query.ts";

const mockAvatars: DbUserAvatarCreate[] = ["a.jpg", "b.jpg", "c.jpg"].map((uri) => ({ id: uri, size: 1 }));
const mockUser: DbPlaUserCreate[] = [
  { pla_uid: "a", platform: Platform.douYin, avatar: "a.jpg", user_name: "old" },
  { pla_uid: "b", platform: Platform.douYin, avatar: "b.jpg" },
  { pla_uid: "c", platform: Platform.douYin },
];
const mockUpdateUser: DbPlaUserCreate[] = [
  { pla_uid: "a", platform: Platform.douYin, avatar: "c.jpg", user_name: "new" },
  { pla_uid: "b", platform: Platform.douYin, avatar: null, user_name: "new2" },
];
beforeEach<Context>(async ({ ijiaDbPool }) => {
  await ijiaDbPool.query(user_avatar.insert(mockAvatars));
  await savePlaUserList(mockUser).query();
});

test("保存作品数据，自动设置头像快照和用户名快照", async function ({ ijiaDbPool }) {
  const mockAssetData: DbPlaAssetCreate[] = [
    { pla_uid: "a", platform: Platform.douYin, asset_id: "p1" },
    { pla_uid: "b", platform: Platform.douYin, asset_id: "p2" },
    { pla_uid: "c", platform: Platform.douYin, asset_id: "p3" },
  ];
  await savePlaAssetList(mockAssetData).query();

  await expect(getAsset()).resolves.toMatchObject({
    p1: { user_avatar_snapshot: "a.jpg", user_name_snapshot: "old" },
    p2: { user_avatar_snapshot: "b.jpg", user_name_snapshot: null },
    p3: { user_avatar_snapshot: null, user_name_snapshot: null },
  });

  // 更新头像
  await savePlaUserList(mockUpdateUser).query();

  await savePlaAssetList([
    { pla_uid: "a", platform: Platform.douYin, asset_id: "p1" },
    { pla_uid: "b", platform: Platform.douYin, asset_id: "p2" },
  ]).query();

  await expect(getAsset()).resolves.toMatchObject({
    p1: { user_avatar_snapshot: "a.jpg", user_name_snapshot: "old" },
    p2: { user_avatar_snapshot: "b.jpg", user_name_snapshot: "new2" },
    p3: { user_avatar_snapshot: null, user_name_snapshot: null },
  });

  async function getAsset() {
    return ijiaDbPool
      .queryRows(pla_asset.select({ asset_id: true, user_name_snapshot: true, user_avatar_snapshot: true }))
      .then((res) => mergeArrayBy(res, (item) => item.asset_id));
  }
});
test("保存评论数据，自动设置头像快照和用户名快照", async function ({ ijiaDbPool }) {
  await savePlaAssetList([{ pla_uid: "a", platform: Platform.douYin, asset_id: "p1" }]).query();

  await savePlaCommentList([
    {
      asset_id: "p1",
      comment_id: "c1",
      pla_uid: "a",
      platform: Platform.douYin,
      comment_type: "00000001",
    },
    {
      asset_id: "p1",
      comment_id: "c2",
      pla_uid: "b",
      platform: Platform.douYin,
      comment_type: "00000001",
    },
    {
      asset_id: "p1",
      comment_id: "c3",
      pla_uid: "c",
      platform: Platform.douYin,
      comment_type: "00000001",
    },
  ]).query();
  await expect(getComment()).resolves.toMatchObject({
    c1: { user_avatar_snapshot: "a.jpg", user_name_snapshot: "old" },
    c2: { user_avatar_snapshot: "b.jpg", user_name_snapshot: null },
    c3: { user_avatar_snapshot: null, user_name_snapshot: null },
  });

  // 更新头像

  await savePlaUserList(mockUpdateUser).query();

  await savePlaCommentList([
    {
      asset_id: "p1",
      comment_id: "c1",
      pla_uid: "a",
      platform: Platform.douYin,
      comment_type: "00000001",
    },
    {
      asset_id: "p1",
      comment_id: "c2",
      pla_uid: "b",
      platform: Platform.douYin,
      comment_type: "00000001",
    },
  ]).query();

  await expect(getComment(), " p").resolves.toMatchObject({
    c1: { user_avatar_snapshot: "a.jpg", user_name_snapshot: "old" },
    c2: { user_avatar_snapshot: "b.jpg", user_name_snapshot: "new2" },
    c3: { user_avatar_snapshot: null, user_name_snapshot: null },
  });

  function getComment() {
    return ijiaDbPool
      .queryRows(pla_comment.select({ comment_id: true, user_name_snapshot: true, user_avatar_snapshot: true }))
      .then((rows) => mergeArrayBy(rows, (item) => item.comment_id));
  }
});

export function mergeArrayBy<T>(list: T[], handler: (item: T) => string | number): Record<string, T> {
  let record: Record<string, T> = {};
  for (const item of list) {
    record[handler(item)] = item;
  }
  return record;
}

import { BaseContext as Context, test } from "../../fixtures/db_connect.ts";
import { beforeEach, expect } from "vitest";
import { DbPlaAssetCreate, DbPlaUserCreate, DbUserAvatarCreate, pla_asset, Platform, user_avatar } from "@ijia/data/db";
import { savePlaAssetList, savePlaUserList } from "@ijia/data/query";

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

export function mergeArrayBy<T>(list: T[], handler: (item: T) => string | number): Record<string, T> {
  let record: Record<string, T> = {};
  for (const item of list) {
    record[handler(item)] = item;
  }
  return record;
}

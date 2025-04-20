import {
  DbPlaAssetCreate,
  DbPlaCommentCreate,
  DbPlaUser,
  DbPlaUserCreate,
  pla_asset,
  pla_asset_check,
  pla_asset_create_key,
  pla_comment,
  pla_comment_create_key,
  pla_pla_comment_check,
  pla_user,
  pla_user_check,
  Platform,
} from "../db.ts";
import { ColumnMeta, SqlTextStatementDataset, YourTable } from "@asla/yoursql";
import { createConflictUpdate, insetFrom, UpdateBehaver } from "./_statement.ts";

/**
 * 保存用户数据
 * 如果已存在，则更新
 * 返回执行插入的行 id
 *
 * @param avatarList uid -> fileInfo。 需要更新的头像映射
 */
export function savePlaUserList(values: DbPlaUserCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  values = values.map((item) => ({
    ...item,
    signature_struct: item.signature_struct ? JSON.stringify(item.signature_struct) : undefined,
  }));
  pla_user_check.checkList(values);
  // 未来表字段新增时，需要考虑那些值可以覆盖, 所以使用 Exclude
  type UpdateKey = Exclude<keyof DbPlaUser | "crawl_check_time", "platform" | "pla_uid" | "create_time">;
  const upsertSql = pla_user
    .insert(values)
    .onConflict(["pla_uid", "platform"])
    .doUpdate(
      createConflictUpdate<UpdateKey>(
        {
          crawl_check_time: "now()",
          user_name: UpdateBehaver.overIfNewNotNull,
          ip_location: UpdateBehaver.overIfNewNotNull,
          avatar: UpdateBehaver.overIfNewNotNull,
          pla_avatar_uri: UpdateBehaver.overIfNewNotNull,
          follower_count: UpdateBehaver.overIfNewNotNull,
          following_count: UpdateBehaver.overIfNewNotNull,
          signature: UpdateBehaver.overIfNewNotNull,
          signature_struct: UpdateBehaver.overIfNewNotNull,

          extra: "pla_user.extra || EXCLUDED.extra",
        },
        pla_user.name,
      ),
    )
    .returning({ pla_uid: true, platform: true, create_time: true, crawl_check_time: true });
  // 返回的将是执行插入的行
  const sql = `WITH tb AS (\n${upsertSql})\nSELECT pla_uid, platform FROM tb where crawl_check_time = create_time;`;

  return new SqlTextStatementDataset<{ pla_uid: string; platform: Platform }>(sql);
}
/**
 * 如果已存在，则更新
 * 返回执行插入的行 id
 */
export function savePlaCommentList(values: DbPlaCommentCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  pla_pla_comment_check.checkList(values);
  const { columns, statement } = insetFrom(values, getDbRawMeta(pla_comment, pla_comment_create_key), {
    table: pla_user,
    keyMap: { user_avatar_snapshot: "avatar", user_name_snapshot: "user_name" },
    on: { pla_uid: "pla_uid", platform: "platform" },
  });
  // 未来表字段新增时，需要考虑那些值可以覆盖, 所以使用 Exclude
  type UpdateKey = Exclude<
    keyof DbPlaCommentCreate | "user_name_snapshot" | "user_avatar_snapshot" | "crawl_check_time",
    | "asset_id"
    | "platform"
    | "pla_uid"
    | "comment_type"
    | "publish_time"
    | "comment_id"
    | "root_comment_id"
    | "parent_comment_id"
  >;

  const upsertSql = pla_comment
    .insert(columns.join(","), statement.toString())
    .onConflict(["platform", "comment_id"])
    .doUpdate(
      createConflictUpdate<UpdateKey>(
        {
          crawl_check_time: "now()",
          author_like: `CASE ${pla_comment.name}.author_like WHEN TRUE THEN TRUE ELSE EXCLUDED.author_like END`, // 如作者赞过，后面又取消赞，则不应更改
          like_count: `CASE WHEN ${pla_comment.name}.like_count > EXCLUDED.like_count
  THEN ${pla_comment.name}.like_count ELSE EXCLUDED.like_count END`, // 只记录最高数量
          extra: "pla_comment.extra || EXCLUDED.extra",
          user_avatar_snapshot: UpdateBehaver.overIfOldIsNull,
          user_name_snapshot: UpdateBehaver.overIfOldIsNull,
          additional_image: UpdateBehaver.overIfOldIsNull,
          additional_image_thumb: UpdateBehaver.overIfOldIsNull,
          content_text: UpdateBehaver.overIfOldIsNull,
          content_text_struct: UpdateBehaver.overIfOldIsNull,
          ip_location: UpdateBehaver.overIfOldIsNull,

          reply_count: UpdateBehaver.overIfNewNotNull,
        },
        pla_comment.name,
      ),
    )
    .returning({ comment_id: true, platform: true, create_time: true, crawl_check_time: true });
  const sql = `WITH tb AS (\n${upsertSql})\nSELECT comment_id, platform FROM tb where crawl_check_time = create_time;`;

  return new SqlTextStatementDataset<{ comment_id: string; platform: Platform }>(sql);
}
/**
 * 保存作品
 * 如果已存在，则更新
 */
export function savePlaAssetList(values: DbPlaAssetCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  pla_asset_check.checkList(values);
  const { columns, statement } = insetFrom(values, getDbRawMeta(pla_asset, pla_asset_create_key), {
    table: pla_user,
    keyMap: { user_avatar_snapshot: "avatar", user_name_snapshot: "user_name" },
    on: { pla_uid: "pla_uid", platform: "platform" },
  });

  // 未来表字段新增时，需要考虑那些值可以覆盖, 所以使用 Exclude
  type UpdateKey = Exclude<
    keyof DbPlaAssetCreate | "user_name_snapshot" | "user_avatar_snapshot" | "crawl_check_time",
    | "asset_id"
    | "platform"
    | "pla_uid"
    | "comment_type"
    | "publish_time"
    | "comment_id"
    | "root_comment_id"
    | "parent_comment_id"
    | "content_type"
  >;

  const upsertSql = pla_asset
    .insert(columns.join(","), statement.toString())
    .onConflict(["asset_id", "platform"])
    .doUpdate(
      createConflictUpdate<UpdateKey>(
        {
          crawl_check_time: "now()",
          content_text_struct: UpdateBehaver.overIfOldIsNull,
          content_text: UpdateBehaver.overIfOldIsNull,
          user_name_snapshot: UpdateBehaver.overIfOldIsNull,
          user_avatar_snapshot: UpdateBehaver.overIfOldIsNull,
          collection_num: UpdateBehaver.overIfNewNotNull,
          forward_num: UpdateBehaver.overIfNewNotNull,
          comment_num: UpdateBehaver.overIfNewNotNull,
          like_count: UpdateBehaver.overIfNewNotNull,
          ip_location: UpdateBehaver.overIfNewNotNull,
          extra: "pla_asset.extra || EXCLUDED.extra",
        },
        pla_asset.name,
      ),
    )
    .returning({ crawl_check_time: true, create_time: true, platform: true, asset_id: true, pla_uid: true });

  // 返回的将是执行插入的行
  const sql = `WITH tb AS (\n${upsertSql})\nSELECT asset_id, platform FROM tb where crawl_check_time = create_time;`;

  return new SqlTextStatementDataset<{ asset_id: string; platform: Platform }>(sql);
}

function getDbRawMeta(table: YourTable<any>, keys: readonly string[]) {
  let types: Record<string, ColumnMeta<unknown>> = {};
  for (const k of keys) {
    types[k] = table.getColumnMeta(k);
  }
  return types;
}

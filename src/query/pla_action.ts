import {
  DbPlaAsset,
  DbPlaAssetCreate,
  DbPlaComment,
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
  Platform,
} from "../db.ts";
import { ObjectToValueKeys, SqlTextStatementDataset, YourTable } from "@asla/yoursql";
import { createConflictUpdate, UpdateBehaver } from "./_statement.ts";
import { insertIntoValues } from "../common/sql.ts";

const pla_user_create_key = [
  "pla_uid",
  "platform",
  "extra",
  "user_name",
  "ip_location",
  "follower_count",
  "following_count",
  "signature",
  "signature_struct",
  "avatar",
  "pla_avatar_uri",
] satisfies (keyof DbPlaUserCreate)[];

const pla_user_check = pla_user.createTypeChecker<DbPlaUserCreate>(pla_user_create_key);

/**
 * 保存用户数据
 * 如果已存在，则更新
 * 返回执行插入的行 id
 *
 * @param avatarList uid -> fileInfo。 需要更新的头像映射
 */
export function savePlaUserList(values: DbPlaUserCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  pla_user_check.checkList(values);
  // 未来表字段新增时，需要考虑那些值可以覆盖, 所以使用 Exclude
  type UpdateKey = Exclude<keyof DbPlaUser | "crawl_check_time", "platform" | "pla_uid" | "create_time">;
  return insertIntoValues("pla_user", values, getTableRawMeta(pla_user, pla_user_create_key))
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
        "pla_user",
      ),
    )
    .returning<Pick<DbPlaUser, "pla_uid" | "platform" | "create_time" | "crawl_check_time" | "pla_avatar_uri">>([
      "pla_uid",
      "platform",
      "create_time",
      "crawl_check_time",
      "pla_avatar_uri",
    ]);
}
/**
 * 如果已存在，则更新
 * 返回执行插入的行 id
 */
export function savePlaCommentList(values: DbPlaCommentCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  pla_pla_comment_check.checkList(values);

  // 未来表字段新增时，需要考虑那些值可以覆盖, 所以使用 Exclude
  type UpdateKey = Exclude<
    keyof DbPlaComment,
    | "asset_id"
    | "platform"
    | "pla_uid"
    | "comment_type"
    | "publish_time"
    | "comment_id"
    | "root_comment_id"
    | "parent_comment_id"
    | "create_time"
    | "reply_last_sync_date"
    | "is_deleted"
    | "platform_delete"
  >;
  // 需要注意
  const upsertSql = insertIntoValues(
    "pla_comment",
    values,
    getTableRawMeta(pla_comment, pla_comment_create_key),
  )
    .onConflict(["platform", "comment_id"])
    .doUpdate(
      createConflictUpdate<UpdateKey>(
        {
          crawl_check_time: "now()",
          author_like: `CASE ${pla_comment.name}.author_like WHEN TRUE THEN TRUE ELSE EXCLUDED.author_like END`, // 如作者赞过，后面又取消赞，则不应更改
          like_count: `CASE WHEN ${pla_comment.name}.like_count > EXCLUDED.like_count
  THEN ${pla_comment.name}.like_count ELSE EXCLUDED.like_count END`, // 只记录最高数量
          extra: "pla_comment.extra || EXCLUDED.extra",
          content_text: UpdateBehaver.overIfNewNotNull,
          content_text_struct: UpdateBehaver.overIfNewNotNull,
          ip_location: UpdateBehaver.overIfOldIsNull,

          reply_count: UpdateBehaver.overIfNewNotNull,
        },
        pla_comment.name,
      ),
    )
    .returning({ comment_id: true, platform: true, create_time: true, crawl_check_time: true });
  const sql =
    `WITH tb AS (\n${upsertSql.genSql()})\nSELECT comment_id, platform FROM tb where crawl_check_time = create_time;`;

  return new SqlTextStatementDataset<{ comment_id: string; platform: Platform }>(sql);
}

/**
 * 保存作品
 * 如果已存在，则更新
 */
export function savePlaAssetList(values: DbPlaAssetCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  pla_asset_check.checkList(values);

  // 未来表字段新增时，需要考虑那些值可以覆盖, 所以使用 Exclude
  type UpdateKey = Exclude<
    keyof DbPlaAsset,
    | "asset_id"
    | "platform"
    | "pla_uid"
    | "comment_id"
    | "root_comment_id"
    | "parent_comment_id"
    | "create_time"
    | "is_deleted"
    | "platform_delete"
    | "comment_last_full_update_time"
    | "comment_last_update_time"
  >;
  const upsertSql = insertIntoValues("pla_asset", values, getTableRawMeta(pla_asset, pla_asset_create_key))
    .onConflict(["asset_id", "platform"])
    .doUpdate(
      createConflictUpdate<UpdateKey>(
        {
          crawl_check_time: "now()",
          extra: "pla_asset.extra || EXCLUDED.extra",
          content_type: UpdateBehaver.overIfOldIsNull,
          publish_time: UpdateBehaver.overIfOldIsNull,

          content_text: UpdateBehaver.overIfNewNotNull,
          content_text_struct: UpdateBehaver.overIfNewNotNull,
          collection_num: UpdateBehaver.overIfNewNotNull,
          forward_num: UpdateBehaver.overIfNewNotNull,
          comment_num: UpdateBehaver.overIfNewNotNull,
          like_count: UpdateBehaver.overIfNewNotNull,
          ip_location: UpdateBehaver.overIfNewNotNull,
        },
        "pla_asset",
      ),
    )
    .returning({ crawl_check_time: true, create_time: true, platform: true, asset_id: true, pla_uid: true });

  // 返回的将是执行插入的行
  const sql = `WITH tb AS (\n${upsertSql})\nSELECT asset_id, platform FROM tb where crawl_check_time = create_time;`;

  return new SqlTextStatementDataset<{ asset_id: string; platform: Platform }>(sql);
}

function getTableRawMeta(table: YourTable<any>, keys: readonly string[]) {
  let types: ObjectToValueKeys<object> = {};
  for (const k of keys) {
    const meta = table.getColumnMeta(k);
    types[k] = {
      assertJsType: meta.sqlType.includes("JSON") ? Object : undefined, // JSON 类型需要特殊处理,避免 Array 会被转为 ARRAY []. 如 content_text_struct 字段
    };
  }
  return types;
}

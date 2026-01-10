import type { CommentExtra, DbPlaComment, DbPlaCommentCreate, Platform } from "@ijia/data/db";
import { SqlTextStatementDataset, TableDefined, YourTable } from "@asla/yoursql";
import { createConflictUpdate, UpdateBehaver } from "./_statement.ts";
import { insertIntoValues } from "../../common/sql.ts";
import { dbTypeMap, getTableRawMeta } from "./_base.ts";

const TABLE = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  reply_last_sync_date: dbTypeMap.genColumn("TIMESTAMPTZ"),
  extra: dbTypeMap.genColumn<CommentExtra>("JSONB", true, "'{}'"),

  is_deleted: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),
  platform_delete: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),

  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_text_struct: dbTypeMap.genColumn("JSONB"),

  additional_image: dbTypeMap.genColumn("VARCHAR"),
  additional_image_thumb: dbTypeMap.genColumn("VARCHAR"),
  comment_type: dbTypeMap.genColumn("BIT(8)", true, "0::BIT(8)"),
  pla_uid: dbTypeMap.genColumn("VARCHAR"),
  publish_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  like_count: dbTypeMap.genColumn("INTEGER"),
  reply_count: dbTypeMap.genColumn("INTEGER"),
  author_like: dbTypeMap.genColumn("BOOLEAN"),

  comment_id: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  root_comment_id: dbTypeMap.genColumn("VARCHAR"),
  parent_comment_id: dbTypeMap.genColumn("VARCHAR"),
  asset_id: dbTypeMap.genColumn("VARCHAR", true),
} satisfies TableDefined;
export const pla_comment_create_key = [
  "author_like",
  "comment_id",
  "content_text",
  "content_text_struct",
  "extra",
  "ip_location",
  "like_count",
  "parent_comment_id",
  "pla_uid",
  "platform",
  "publish_time",
  "asset_id",
  "root_comment_id",
  "comment_type",
  "reply_count",
] as const;
export const pla_comment = new YourTable<DbPlaComment>("pla_comment", TABLE);
export const pla_pla_comment_check = pla_comment.createTypeChecker<DbPlaCommentCreate>(pla_comment_create_key);

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
    "pla_comment as c",
    values,
    getTableRawMeta(pla_comment, pla_comment_create_key),
  )
    .onConflict(["platform", "comment_id"])
    .doUpdate(
      createConflictUpdate<UpdateKey>(
        {
          crawl_check_time: "now()",
          author_like: `CASE c.author_like WHEN TRUE THEN TRUE ELSE EXCLUDED.author_like END`, // 如作者赞过，后面又取消赞，则不应更改
          like_count: `CASE WHEN c.like_count > EXCLUDED.like_count
  THEN c.like_count ELSE EXCLUDED.like_count END`, // 只记录最高数量
          extra: `c.extra || EXCLUDED.extra`,
          content_text: UpdateBehaver.overIfNewNotNull,
          content_text_struct: UpdateBehaver.overIfNewNotNull,
          ip_location: UpdateBehaver.overIfOldIsNull,

          reply_count: UpdateBehaver.overIfNewNotNull,
        },
        "c",
      ),
    )
    .returning({ comment_id: true, platform: true, create_time: true, crawl_check_time: true });
  const sql =
    `WITH tb AS (\n${upsertSql.genSql()})\nSELECT comment_id, platform FROM tb where crawl_check_time = create_time;`;

  return new SqlTextStatementDataset<{ comment_id: string; platform: Platform }>(sql);
}

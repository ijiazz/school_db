import { SqlTextStatementDataset, type TableDefined, YourTable } from "@asla/yoursql";
import { dbTypeMap, getTableRawMeta } from "./_base.ts";
import type { AssetExtra, DbPlaAsset, DbPlaAssetCreate, Platform } from "@ijia/data/db";
import { insertIntoValues } from "../../common/sql.ts";
import { createConflictUpdate, UpdateBehaver } from "./_statement.ts";

const pla_assetDefine = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now"),
  comment_last_full_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  comment_last_update_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  extra: dbTypeMap.genColumn<AssetExtra>("JSONB", true, "'{}'"),

  platform_delete: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),
  is_deleted: dbTypeMap.genColumn("BOOLEAN", true, "FALSE"),

  publish_time: dbTypeMap.genColumn("TIMESTAMPTZ"),
  content_text: dbTypeMap.genColumn("VARCHAR"),
  content_text_struct: dbTypeMap.genColumn("JSONB"),
  content_type: dbTypeMap.genColumn("BIT(8)", true, "0::BIT(8)"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  like_count: dbTypeMap.genColumn("INTEGER"),
  comment_num: dbTypeMap.genColumn("INTEGER"),
  collection_num: dbTypeMap.genColumn("INTEGER"),
  forward_num: dbTypeMap.genColumn("INTEGER"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  asset_id: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
} satisfies TableDefined;

const pla_asset = new YourTable<DbPlaAsset>("pla_asset", pla_assetDefine);
const pla_asset_create_key = [
  "collection_num",
  "content_text",
  "forward_num",
  "ip_location",
  "like_count",
  "pla_uid",
  "platform",
  "publish_time",
  "asset_id",
  "content_text_struct",
  "comment_num",
  "extra",
  "content_type",
] as const;
const pla_asset_check = pla_asset.createTypeChecker<DbPlaAssetCreate>(pla_asset_create_key);
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
/**
 * 保存作品
 * 如果已存在，则更新
 */
export function savePlaAssetList(values: DbPlaAssetCreate[]) {
  if (!values.length) throw new Error("values不能为空");
  pla_asset_check.checkList(values);

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

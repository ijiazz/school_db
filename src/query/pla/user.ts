import type { DbPlaUser, DbPlaUserCreate, UserExtra } from "@ijia/data/db";
import { dbTypeMap, getTableRawMeta } from "./_base.ts";
import { insertIntoValues } from "../../common/sql.ts";
import { createConflictUpdate, UpdateBehaver } from "./_statement.ts";
import { TableDefined, YourTable } from "@asla/yoursql";

const TABLE_DEFINE = {
  create_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  crawl_check_time: dbTypeMap.genColumn("TIMESTAMPTZ", true, "now()"),
  extra: dbTypeMap.genColumn<UserExtra>("JSONB", true, "'{}'"),
  pla_avatar_uri: dbTypeMap.genColumn("VARCHAR"),

  user_name: dbTypeMap.genColumn("VARCHAR"),
  ip_location: dbTypeMap.genColumn("VARCHAR"),
  avatar: dbTypeMap.genColumn("VARCHAR"),

  pla_uid: dbTypeMap.genColumn("VARCHAR", true),
  platform: dbTypeMap.genColumn("platform_flag", true),
  follower_count: dbTypeMap.genColumn("INT"),
  following_count: dbTypeMap.genColumn("INT"),
  signature: dbTypeMap.genColumn("VARCHAR"),
  signature_struct: dbTypeMap.genColumn("JSONB"),
} satisfies TableDefined;

export const pla_user = new YourTable<DbPlaUser>("pla_user", TABLE_DEFINE);

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

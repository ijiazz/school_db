import { dbPool } from "../../common/dbclient.ts";
import { v } from "../../common/sql.ts";
import { select } from "@asla/yoursql";

/** 获取指定用户的角色列表。不包含已删除的用户 */
export async function getUserRoleNameList(userId: number): Promise<UserWithRole | null> {
  const [userInfo] = await dbPool.queryRows(
    select<UserWithRole>({
      user_id: "u.id",
      email: "u.email",
      nickname: "u.nickname",
      role_id_list: select<{ role_id: "string" }>({ role_id: "array_agg(bind.role_id)" })
        .from("user_role_bind", { as: "bind" })
        .where(`bind.user_id=${v(userId)}`)
        .toSelect(),
    })
      .from("public.user", { as: "u" })
      .where("NOT u.is_deleted"),
  );
  if (!userInfo) return null;
  if (!userInfo.role_id_list) userInfo.role_id_list = [];
  return userInfo;
}
export type UserWithRole = SampleUserInfo & {
  role_id_list: string[];
};

/** 从数据库获取用户信息 */
export async function getValidUserSampleInfoByUserId(
  userId: number,
): Promise<SampleUserInfo | null> {
  const [info] = await dbPool.queryRows(
    select<SampleUserInfo>(["user_id AS id", "email", "nickname", "is_deleted"])
      .from("public.user")
      .where([`id=${v(userId)}`]),
  );
  if (!info) return null;

  return info;
}

export type SampleUserInfo = {
  user_id: number;
  email: string;
  nickname: string | null;
  is_deleted?: boolean;
};

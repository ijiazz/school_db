import { user, user_profile } from "@ijia/data/db";
import { SqlTextStatementDataset } from "@asla/yoursql";

//TODO 账号注销后重新注册 (is_deleted = true). 需要清除账号数据

export type CreateUserOption = {
  password?: string;
  salt?: string;
  nickname?: string;
  /** 指定用户 ID */
  id?: number;
};

/**
 * 创建用户。返回创建的用户 id, 如果用户已存在则返回 undefined。
 */
export function createUser(
  email: string,
  userInfo: CreateUserOption,
): SqlTextStatementDataset<{ user_id: number }> {
  const { nickname, password, salt, id } = userInfo;
  const sql = `WITH inserted AS (
  ${
    user
      .insert({ email, password: password, pwd_salt: salt, nickname, id })
      .onConflict(["email"])
      .doNotThing()
      .returning<{ user_id: number }>({ user_id: "id" })
  }
  ), add_profile AS(
  ${user_profile.insert("user_id", `SELECT user_id FROM inserted`)}
  )
  SELECT * FROM inserted
  `;

  return new SqlTextStatementDataset<{ user_id: number }>(sql);
}

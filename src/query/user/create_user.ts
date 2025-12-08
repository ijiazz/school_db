import { user, user_profile } from "@ijia/data/db";
import { insertInto, withAs } from "@asla/yoursql";
import { dbPool, ExecutableSQL } from "../../common/dbclient.ts";
import { insertIntoValues } from "../../common/sql.ts";

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
export function createUser(email: string, userInfo: CreateUserOption): ExecutableSQL<{ user_id: number }> {
  const { nickname, password, salt, id } = userInfo;
  const base = withAs("inserted", () => {
    return insertIntoValues(user.name, { email, password: password, pwd_salt: salt, nickname, id })
      .onConflict(["email"])
      .doNotThing()
      .returning<{ user_id: number }>({ user_id: "id" })
      .genSql();
  }).as("add_profile", () => {
    return insertInto(user_profile.name, ["user_id"]).select(`SELECT user_id FROM inserted`).genSql();
  });

  const sql = `${base.toString()}\nSELECT * FROM inserted`;
  return dbPool.createQueryableSQL(
    sql,
    (pool, sql) => pool.queryRows<{ user_id: number }>(sql).then((rows) => rows[0]),
  );
}

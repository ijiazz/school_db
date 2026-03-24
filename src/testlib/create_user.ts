import { createUser } from "@ijia/data/query";
import { dbPool } from "../common/dbclient.ts";
import { v } from "@asla/yoursql";
/** 获取数据库级别的自增唯一 ID */
export async function getUniqueIdFormDb() {
  const { id } = await dbPool.queryFirstRow<{ id: number }>("SELECT nextval('test_id_seq') AS id");
  return id;
}

/** 将角色绑定到用户，如果角色不存在，则创建 */
export async function bindUserRole(userId: number, rolesInput: Set<string> | string[]) {
  const roles = rolesInput instanceof Set ? rolesInput : new Set(rolesInput);
  const values = Array.from(roles).map((r) => ({ id: r }));
  const base2 = v.gen`WITH role_id(id) AS (
      VALUES ${new String(v.createExplicitValues(values, { id: { sqlType: "TEXT", assertJsType: "string" } }).text)}
    ), roles AS (
      INSERT INTO role (id) 
      SELECT role_id.id FROM role_id 
      ON CONFLICT (id) DO NOTHING
    )
    INSERT INTO user_role_bind(user_id, role_id)
    SELECT ${userId}, id AS role_id FROM role_id  
    `;

  await dbPool.queryCount(base2);
}

export async function newTestUser(nickname: string, option: PrepareUserOption = {}): Promise<TestUserInfo> {
  await using t = dbPool.begin();
  const tempEmail = "temp_test@ijiazz.cn";
  const { user_id: id } = await t.queryFirstRow(
    createUser(tempEmail, { nickname: nickname, password: option.password }),
  );
  const email = `${nickname.toLowerCase()}${id}@ijiazz.cn`;
  await t.execute(v.gen`UPDATE public.user SET email=${email} WHERE id=${id}`);
  await t.commit();
  if (option.roles) {
    await bindUserRole(id, option.roles);
  }

  return {
    email,
    id,
    nickname: nickname,
    password: option.password,
  };
}
export type TestUserInfo = {
  id: number;
  nickname: string;
  email: string;
  password?: string;
};

export type PrepareUserOption = {
  password?: string;
  roles?: Set<string> | string[]; // 角色
};

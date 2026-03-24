import { DbClassCreate, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { dbPool, ExecutableSQL } from "../common/dbclient.ts";
import { insertIntoValues } from "../common/sql.ts";

export async function initPublicClass() {
  const list: DbClassCreate[] = [];
  for (let i = 1; i <= 29; i++) {
    list.push({ class_name: `JiaJia-${i}`, description: `${i} 群`, parent_class_id: PUBLIC_CLASS_ROOT_ID });
  }
  const inserted = await dbPool.queryCount(insertIntoValues("class", list).onConflict(["id"]).doNotThing());

  console.log(`新增${inserted}个班级`);
}

export function initRoles(): ExecutableSQL<void> {
  const sql = insertIntoValues("role", [
    { id: "root", role_name: "超级管理员", description: "超级管理员" },
    { id: "admin", role_name: "管理员", description: "管理员" },
  ]);

  return dbPool.createQueryableSQL(sql.toString(), (pool, sql) => pool.queryCount(sql).then(() => {}));
}

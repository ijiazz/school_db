import { DbClassCreate, dclass, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";

export async function initPublicClass() {
  const list: DbClassCreate[] = [];
  for (let i = 1; i <= 29; i++) {
    list.push({ class_name: `JiaJia-${i}`, description: `${i} 群`, parent_class_id: PUBLIC_CLASS_ROOT_ID });
  }
  const inserted = await dclass.insert(list).onConflict(["id"]).doNotThing().queryCount();

  console.log(`新增${inserted}个班级`);
}

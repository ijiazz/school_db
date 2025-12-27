import { test } from "../../fixtures/db_connect.ts";

test("创建或修改 user 表，会触发数据库触发器并自动更新用户头像引用计数", async function ({ ijiaDbPool }) {
  console.log("success");
});

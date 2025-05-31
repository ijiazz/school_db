import { createInitIjiaDb } from "@ijia/data/testlib";

await createInitIjiaDb(
  {
    database: "postgres", //这是要连接的数据库，不是要创建的数据库
    user: "postgres",
    // password: "pwd",
    hostname: "127.0.0.1",
    port: 5432,
  },
  "ijia_test",
  { ensureOwner: true, owner: "ijia_mr" },
);
console.log("创建完成");

import { createInitIjiaDb } from "@ijia/data/testlib.ts";

await createInitIjiaDb({
  database: "postgres",
  user: "postgres",
  // password: "pwd",
  // hostname: "127.0.0.1",
  // port: 5432,
}, "ijia");
console.log("创建完成");

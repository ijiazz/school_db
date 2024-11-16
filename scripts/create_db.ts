import { createInitDb } from "../src/testlib.ts";

await createInitDb({
  database: "ijia_test",
  user: "eaviyi",
  // password: "pwd",
  //   hostname: "127.0.0.1",
  //   port: 5432,
});
console.log("创建完成");

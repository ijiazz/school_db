import type { ViteUserConfig } from "vitest/config";

import path from "node:path";
const dirname = import.meta.dirname!;
export default {
  esbuild: { target: "es2022" },
  test: {
    alias: [
      { find: /^@ijia\/data\//, replacement: path.join(dirname, "../src") + "/" },
    ],
    env: {
      TEST_LOGIN_DB: "pg://test@127.0.0.1:5432/postgres",
      IJIA_TEMPLATE_DBNAME: "test_ijia_template",
    },
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./setup/extend_yoursql.ts"],
    globalSetup: "./setup/setup_pgsql.ts",
  },
} satisfies ViteUserConfig;

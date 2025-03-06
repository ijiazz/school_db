import type { ViteUserConfig } from "vitest/config";
import process from "node:process";
import path from "node:path";
const dirname = import.meta.dirname!;

const PG_URL = process.env.PG_URL || "pg://test@127.0.0.1:5432/postgres";

export default {
  esbuild: { target: "es2022" },
  test: {
    alias: [
      { find: /^@ijia\/data\//, replacement: path.join(dirname, "./src") + "/" },
      { find: /^@\//, replacement: path.join(dirname, "./src") + "/" },
      { find: /^@test\//, replacement: path.join(dirname, "./test") + "/" },
    ],
    env: {
      TEST_LOGIN_DB: PG_URL,
    },
    setupFiles: ["./test/setup/extend_yoursql.ts"],
  },
} satisfies ViteUserConfig;

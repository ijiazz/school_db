import type { ViteUserConfig } from "vitest/config";
import path from "node:path";
import deno from "@deno/vite-plugin";
const dirname = import.meta.dirname!;

export default {
  plugins: [deno()],
  test: {
    alias: [
      { find: /^@ijia\/data\//, replacement: path.join(dirname, "./src") + "/" },
      { find: /^@\//, replacement: path.join(dirname, "./src") + "/" },
      { find: /^@test\//, replacement: path.join(dirname, "./test") + "/" },
    ],
  },
} satisfies ViteUserConfig;

import { dts } from "rolldown-plugin-dts";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };

import { RolldownOptions } from "rolldown";

export function getConfig(): RolldownOptions {
  const dir = import.meta.dirname!;
  const rootDir = path.join(dir, "..");

  const input: RolldownOptions["input"] = {
    db: "src/db.ts",
    oss: "src/oss.ts",
    testlib: "src/testlib.ts",
    query: "src/query.ts",
  };
  for (const [k, v] of Object.entries(input)) {
    input[k] = path.resolve(rootDir, v);
  }
  const outputDir = path.join(rootDir, "dist");
  return {
    input,
    output: {
      dir: outputDir,
      sourcemap: true,
    },
    plugins: [dts({ tsconfig: path.join(rootDir, "tsconfig.json") })],
    external: [...Object.keys(packageJson.dependencies), /^node:/],
  };
}

export default getConfig();

import esmTsPlugin from "@rollup/plugin-typescript";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };
/**
 * @param option 描述
 * @param {Object|undefined} option
 * @param {string|undefined} option.tslib
 * @returns {import("rollup").RollupOptions}
 */
export function getConfig(option = {}) {
  const dir = import.meta.dirname;
  const rootDir = path.join(dir, "..");

  /** @type {import("rollup").InputOption} */
  const input = {
    db: "src/db.ts",
    oss: "src/oss.ts",
    testlib: "src/testlib.ts",
    query: "src/query.ts",
  };
  for (const [k, v] of Object.entries(input)) {
    input[k] = path.resolve(rootDir, v);
  }
  const outputDir = path.join(rootDir, "dist");
  /** @type {import("rollup").RollupOptions} */
  return {
    input,
    external: [...Object.keys(packageJson.dependencies), "tslib", /^node:/],
    plugins: [
      esmTsPlugin({
        tslib: option.tslib,
        tsconfig: path.join(rootDir, "tsconfig.json"),
        compilerOptions: {
          baseUrl: "",
          declaration: true,
          declarationDir: outputDir,
          rootDir: "src",
          outDir: outputDir,
        },
      }),
    ],
    output: {
      dir: outputDir,
      compact: false,
      minifyInternalExports: false,
      sourcemap: true,
      sourcemapExcludeSources: true,
      preserveModules: true,
      preserveModulesRoot: path.resolve(rootDir, "src"),
    },
  };
}
export default getConfig();

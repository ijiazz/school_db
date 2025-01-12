import { OutputOptions, rollup, RollupOptions } from "npm:rollup";
import esmTsPlugin from "npm:@rollup/plugin-typescript";
import packageJson from "../package.json" with { type: "json" };
async function getTsLib() {
  try {
    console.log("正在下载 tslib");
    const tslib = await fetch("https://esm.sh/v135/tslib@2.8.1/es2022/tslib.bundle.mjs");
    const tslibJs = await tslib.text();
    console.log("下载成功");
    return tslibJs;
  } catch (error) {
    throw "下载 tslib 失败";
  }
}

const tsPlguin = esmTsPlugin as any as typeof esmTsPlugin.default;
const tslib = await getTsLib();
const config: RollupOptions = {
  input: {
    db: "src/db.ts",
    oos: "src/oos.ts",
    testlib: "src/testlib.ts",
    yoursql: "src/yoursql.ts",
    query: "src/query.ts",
  },
  plugins: [tsPlguin({
    tslib,
    compilerOptions: {
      declaration: true,
      declarationDir: "dist",
      rootDir: "src",
    },
  })],
  external: [...Object.keys(packageJson.dependencies), /^node:/],
  output: {
    dir: "dist",
    compact: false,
    minifyInternalExports: false,
    sourcemap: true,
    sourcemapExcludeSources: true,
    preserveModules: true,
    preserveModulesRoot: "src",
  },
};

const roll = await rollup(config);

await roll.write(config.output as OutputOptions);

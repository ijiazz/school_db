import { defineEvConfig } from "@eavid/lib-dev/rollup";
export default defineEvConfig({
  input: { db: "src/db.ts", oos: "src/oos.ts", testlib: "src/testlib.ts" },
  output: {
    dir: "dist",
    compact: false,
    minifyInternalExports: false,
    sourcemap: true,
    sourcemapExcludeSources: true,
    preserveModules: true,
    preserveModulesRoot: "src",
  },
  extra: {
    typescript: {
      tsconfig: "tsconfig.json",
      compilerOptions: {
        declaration: true,
        declarationDir: "dist",
        rootDir:"src"
      },
    },
  },
});

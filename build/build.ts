import { OutputOptions, rollup } from "rollup";
import { getConfig } from "./rollup.config.mjs";
import path from "node:path";
const tslibFile = path.join(import.meta.dirname!, "./temp/tslib.mjs");

await ensureTslib(tslibFile);
const config = getConfig({ tslib: tslibFile });
const roll = await rollup(config);

await roll.write(config.output as OutputOptions);

async function ensureTslib(target: string) {
  const exist = await Deno.stat(target).then((f) => f.isFile, () => false);
  if (!exist) await getTsLib(target);
}
async function getTsLib(targetFilePath: string) {
  try {
    console.log("正在下载 tslib");
    const tslib = await fetch(
      "https://esm.sh/v135/tslib@2.8.1/es2022/tslib.bundle.mjs",
    );
    await Deno.mkdir(path.dirname(targetFilePath), { recursive: true });
    await Deno.writeFile(targetFilePath, tslib.body!, { create: true });
    console.log("下载成功");
  } catch (error) {
    console.error(error);
    throw "下载 tslib 失败";
  }
}

import { getAllBuckets } from "../oos/const.ts";
import { createFsOOS, type OOS } from "../oos/fs_oos.ts";
import process from "node:process";
import path from "node:path";
import { ENV } from "../common/env.ts";

let oos: OOS;
export function getOOS(): OOS {
  if (!oos) {
    const buckets: string[] = getAllBuckets();
    try {
      let rooDir = ENV.OOS_ROOT_DIR;
      if (!rooDir) {
        rooDir = path.resolve("./data/oos");
        console.warn(`缺少 OOS_ROOT_DIR 环境变量，将使用默认值 ${rooDir}`);
      }
      console.log(`OOS: ${rooDir}`);
      oos = createFsOOS(rooDir, Object.values(buckets));
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
  return oos;
}
export function setOos(newOos: OOS) {
  if (oos) {
    console.warn("Update oos instance");
  }
  oos = newOos;
}

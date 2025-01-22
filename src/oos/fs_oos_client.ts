import { getAllBuckets } from "../oos/const.ts";
import { createFsOOS, type OOS } from "../oos/fs_oos.ts";
import process from "node:process";
import path from "node:path";
import { getEnv } from "../common/get_env.ts";

let oos: OOS;
export function getOOS(): OOS {
  if (!oos) {
    const buckets: string[] = getAllBuckets();
    try {
      const rooDir = path.resolve(getEnv("OOS_ROOT_DIR", true));
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
  if (oos) throw new Error("OOS 已创建");
  oos = newOos;
}

import { getAllBuckets } from "../oss/const.ts";
import { createFsOSS, type OSS, OssBucket } from "../oss/fs_oss.ts";
import process from "node:process";
import path from "node:path";
import { ENV } from "../common/env.ts";
// 这里的设计是为了方便测试时 mock OSS 实例
let oss: OSS;
export function getOSS(): OSS {
  if (!oss) {
    const buckets: string[] = getAllBuckets();
    try {
      let rooDir = ENV.OSS_ROOT_DIR;
      if (!rooDir) {
        rooDir = path.resolve("./data/oss");
        console.warn(`缺少 OSS_ROOT_DIR 环境变量，将使用默认值 ${rooDir}`);
      }
      console.log(`OSS: ${rooDir}`);
      oss = createFsOSS(rooDir, Object.values(buckets));
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
  return oss;
}
export function getOssBucket(bucket: string): OssBucket {
  if (!oss) {
    return getOSS().getBucket(bucket);
  }
  return oss.getBucket(bucket);
}
export function setOSS(newOSS: OSS) {
  if (oss) {
    console.warn("Update oss instance");
  }
  oss = newOSS;
}

export * from "./cache/RedisPool.ts";

import { RedisPool } from "./cache/RedisPool.ts";
import { ENV } from "./common/env.ts";
export const redisPool = new RedisPool(
  () => {
    let url = ENV.REDIS_CONNECT_URL;
    if (!url) {
      url = "redis://127.0.0.1:6379";
      console.warn("未配置 REDIS_CONNECT_URL 环境变量, 将使用默认值：" + url);
    }
    return url;
  },
);

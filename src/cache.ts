export * from "./cache/RedisPool.ts";

import { RedisPool } from "./cache/RedisPool.ts";

export const redisPool = new RedisPool();

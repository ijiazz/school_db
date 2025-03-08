import process from "node:process";

export interface AppEnv {
  OOS_ROOT_DIR?: string;
  DATABASE_URL?: string;
  REDIS_CONNECT_URL?: string;
}
export const ENV: AppEnv = process.env as AppEnv;

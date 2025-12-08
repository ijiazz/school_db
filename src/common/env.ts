import process from "node:process";

export interface AppEnv {
  OSS_ROOT_DIR?: string;
}
export const ENV: AppEnv = process.env as AppEnv;

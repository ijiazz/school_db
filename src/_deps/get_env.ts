import process from "node:process";

export function getEnv(key: string, throwIfNotExist: true): string;
export function getEnv(key: string, throwIfNotExist?: boolean): string | undefined;
export function getEnv(key: string, throwIfNotExist?: boolean) {
  const value = process.env[key];
  if (!value && throwIfNotExist) throw new EnvMissingError(key);
  return value;
}
class EnvMissingError extends Error {
  constructor(envName: string) {
    super(`缺少 ${envName} 环境变量`);
  }
}

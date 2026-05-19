export const ERRORS = {
  /** token 不存在、token 无效 */
  RequiredLogin: "RequiredLogin",
  /** token 已过期 */
  TokenExpired: "TokenExpired",
  /** 账户不存在 */
  AccountNotExist: "AccountNotExist",
  /** 账号已被冻结 */
  AccountFrozen: "AccountFrozen",
} as const;

export type CreateError = (info: { code: string; message: string }) => Error;

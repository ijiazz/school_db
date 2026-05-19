import type { AccessToken } from "./auth.ts";
import { type CreateError, ERRORS } from "@/auth/error.ts";

export class JWTAuth<T> {
  constructor(
    config: JWTAuthConfig<T>,
  ) {
    this.#verifyAccessToken = config.verifyAccessToken;
    this.accessToken = config.accessToken;
    this.#createError = config.createError || ((info) => {
      return new Error(info.message);
    });
  }
  #createError: CreateError;
  #verifyAccessToken: (token: string) => Promise<AccessToken<T>>;
  private accessToken?: string;

  #jwtInfo?: Promise<AccessToken<T>> | AccessToken<T>;

  /**
   * 刷新令牌，返回一个重置了签发时间和过期时间的新的令牌，数据不变。
   */
  async refreshToken(): Promise<AccessToken<T>> {
    if (!this.#jwtInfo) {
      throw new Error("没有令牌信息可供刷新");
    }
    const accessToken = await this.#jwtInfo;
    return accessToken.refresh();
  }
  /**
   * 检查令牌是否需要刷新或删除，并返回结果。
   *
   * 如果令牌过期，返回 { needDelete: true }，如果令牌需要刷新，返回 { needRefresh: true }，否则返回 {}。
   */
  async checkUpdateToken(): Promise<CheckUpdateTokenResult> {
    if (!this.#jwtInfo) {
      return {};
    }
    const accessToken = await this.#jwtInfo;
    if (accessToken.isExpired) {
      return { needDelete: true }; // 删除令牌
    }
    if (accessToken.needRefresh) {
      return { needRefresh: true };
    }
    return {};
  }

  /**
   * 获取令牌中的数据。如果令牌无效或过期，则抛出相应的错误。
   */
  async getJwtInfo(): Promise<T> {
    const accessToken = this.accessToken;
    if (!accessToken) throw this.#createError({ code: ERRORS.RequiredLogin, message: "需要登录" });

    if (!this.#jwtInfo) {
      const promise = this.#verifyAccessToken(accessToken).catch(
        (e) => {
          throw this.#createError({ code: ERRORS.RequiredLogin, message: "需要登录" });
        },
      );
      this.#jwtInfo = promise;
    }
    const token = await this.#jwtInfo;
    this.#jwtInfo = token;

    if (token.isExpired) {
      throw this.#createError({ code: ERRORS.TokenExpired, message: "身份认证已过期" });
    }
    return token.data;
  }
}

export interface CheckUpdateTokenResult {
  needDelete?: boolean;
  needRefresh?: boolean;
}
export type JWTAuthConfig<T> = {
  accessToken?: string;
  verifyAccessToken: (token: string) => Promise<AccessToken<T>>;
  createError?: CreateError;
};

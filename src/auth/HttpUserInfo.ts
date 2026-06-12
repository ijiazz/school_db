import {
  getUserRoleNameList,
  getValidUserSampleInfoByUserId,
  SampleUserInfo,
  UserWithRole,
} from "@ijia/school-db/query";
import type { CheckUpdateTokenResult, JWTAuth } from "./JWTAuth.ts";
import type { AccessUserData } from "./ijia_token.ts";
import type { AccessToken } from "./auth.ts";
import { type CreateError, ERRORS } from "@/auth/error.ts";

export interface HttpUserConfig {
  /** 当 token 校验错误时创建错误的 */
  createError: CreateError;
  /** 超级管理员角色 ID，如果用户存在这个 ID，则拥有所有角色权限 */
  rootRoleId: string;
}
export class HttpUserInfo {
  constructor(
    jwtAuth: JWTAuth<AccessUserData>,
    config: Partial<HttpUserConfig> = {},
  ) {
    this.#jwtAuth = jwtAuth;
    this.#config = {
      createError: config.createError ?? ((info) => new Error(info.message)),
      rootRoleId: config.rootRoleId ?? "root",
    };
  }
  #config: HttpUserConfig;
  #jwtAuth: JWTAuth<AccessUserData>;
  checkUpdateToken(): Promise<CheckUpdateTokenResult> {
    return this.#jwtAuth.checkUpdateToken();
  }
  refreshToken(): Promise<AccessToken<AccessUserData>> {
    return this.#jwtAuth.refreshToken();
  }

  #roleNameList?: Promise<UserWithRole>;
  async getUserId(): Promise<number> {
    const { userId } = await this.#jwtAuth.getJwtInfo();
    return userId;
  }
  /** 获取有效用户的角色列表 */
  async getRolesFromDb(): Promise<UserWithRole> {
    if (!this.#roleNameList) {
      this.#roleNameList = this.getUserId().then(async (userId) => {
        const userInfo = await getUserRoleNameList(+userId);
        if (!userInfo) throw this.#config.createError({ code: ERRORS.AccountNotExist, message: "账号不存在" });
        if (!userInfo.role_id_list) userInfo.role_id_list = [];
        return userInfo;
      });
    }
    return this.#roleNameList;
  }
  async hasRolePermission(requiredAnyRoles: Set<string> | string): Promise<boolean> {
    const { role_id_list } = await this.getRolesFromDb();
    const RootRole = this.#config.rootRoleId;
    if (typeof requiredAnyRoles === "string") {
      return role_id_list.some((role) => role === requiredAnyRoles || (RootRole && role === RootRole));
    } else {
      for (const element of role_id_list) {
        if ((RootRole && element === RootRole)) {
          return true;
        }
        if (requiredAnyRoles.has(element)) return true;
      }
    }
    return false;
  }

  #userInfo?: Promise<SampleUserInfo>;
  async getValidUserSampleInfo(): Promise<SampleUserInfo> {
    if (!this.#userInfo) {
      this.#userInfo = this.getUserId().then((userId) => getValidUserSampleInfoByUserId(userId)).then((user) => {
        const createError = this.#config.createError;
        if (!user) throw createError({ code: ERRORS.AccountNotExist, message: "账号不存在" });
        if (user.is_deleted) throw createError({ code: ERRORS.AccountFrozen, message: "账号已被冻结" });
        return user;
      });
    }
    return this.#userInfo;
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessToken, ERRORS, HttpUserConfig, HttpUserInfo, JWTAuth } from "@/auth.ts";
import { type AccessUserData, AuthTokenType } from "@/auth/ijia_token.ts";

const queryMock = vi.hoisted(() => ({
  getUserRoleNameList: vi.fn(),
  getValidUserSampleInfoByUserId: vi.fn(),
}));

vi.mock("@ijia/data/query", () => ({
  getUserRoleNameList: queryMock.getUserRoleNameList,
  getValidUserSampleInfoByUserId: queryMock.getValidUserSampleInfoByUserId,
}));

describe("HttpUserInfo", () => {
  function createAccessToken(option: {
    userId: number;
    isExpired?: boolean;
    needRefresh?: boolean;
    refresh?: () => Promise<AccessToken<AccessUserData>>;
  }): AccessToken<AccessUserData> {
    return {
      token: "token-value",
      maxAge: null,
      isExpired: option.isExpired ?? false,
      needRefresh: option.needRefresh ?? false,
      data: { type: AuthTokenType.User, userId: option.userId },
      refresh: option.refresh ?? (() => Promise.resolve(undefined as never)),
    };
  }

  function createUserInfo(option: {
    accessToken?: AccessToken<AccessUserData>;
    createError?: (info: { code: string; message: string }) => Error;
    rootRoleId?: string;
  } = {}) {
    const verifyAccessToken = vi.fn().mockResolvedValue(option.accessToken ?? createAccessToken({ userId: 7 }));
    const createError = option.createError ??
      ((info: { code: string; message: string }) => new Error(`${info.code}:${info.message}`));
    const userInfo = createHttpUserInfo({
      accessToken: "access-token",
      verifyAccessToken,
      createError,
      rootRoleId: option.rootRoleId,
    });
    return { userInfo, verifyAccessToken, createError };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserId 会从 jwt 中读取用户 ID 并缓存 token 校验", async () => {
    const { userInfo, verifyAccessToken } = createUserInfo();

    await expect(userInfo.getUserId()).resolves.toBe(7);
    await expect(userInfo.getUserId()).resolves.toBe(7);

    expect(verifyAccessToken).toHaveBeenCalledTimes(1);
  });

  it("getRolesFromDb 会缓存查询结果，并把空角色列表归一化为空数组", async () => {
    queryMock.getUserRoleNameList.mockResolvedValue({ user_id: 7, role_id_list: undefined });
    const { userInfo } = createUserInfo();

    await expect(userInfo.getRolesFromDb()).resolves.toEqual({ user_id: 7, role_id_list: [] });
    await expect(userInfo.getRolesFromDb()).resolves.toEqual({ user_id: 7, role_id_list: [] });

    expect(queryMock.getUserRoleNameList).toHaveBeenCalledTimes(1);
    expect(queryMock.getUserRoleNameList).toHaveBeenCalledWith(7);
  });

  it("角色检查支持字符串、集合和 rootRoleId 兜底", async () => {
    queryMock.getUserRoleNameList.mockResolvedValue({ user_id: 7, role_id_list: ["teacher", "root"] });
    const { userInfo } = createUserInfo();

    await expect(userInfo.hasRolePermission("teacher")).resolves.toBe(true);
    await expect(userInfo.hasRolePermission(new Set(["student", "manager"]))).resolves.toBe(true);
    await expect(userInfo.hasRolePermission("guest")).resolves.toBe(true);
  });

  it("查不到角色信息时会抛出 AccountNotExist", async () => {
    queryMock.getUserRoleNameList.mockResolvedValue(null);
    const createError = vi.fn(({ code, message }) => new Error(`${code}:${message}`));
    const { userInfo } = createUserInfo({ createError });

    await expect(userInfo.getRolesFromDb()).rejects.toThrow(`${ERRORS.AccountNotExist}:账号不存在`);
    expect(createError).toHaveBeenCalledWith({ code: ERRORS.AccountNotExist, message: "账号不存在" });
  });

  it("getValidUserSampleInfo 会缓存结果并返回有效用户信息", async () => {
    queryMock.getValidUserSampleInfoByUserId.mockResolvedValue({ id: 7, nickname: "tester", is_deleted: false });
    const { userInfo } = createUserInfo();

    await expect(userInfo.getValidUserSampleInfo()).resolves.toMatchObject({ id: 7, nickname: "tester" });
    await expect(userInfo.getValidUserSampleInfo()).resolves.toMatchObject({ id: 7, nickname: "tester" });

    expect(queryMock.getValidUserSampleInfoByUserId).toHaveBeenCalledTimes(1);
    expect(queryMock.getValidUserSampleInfoByUserId).toHaveBeenCalledWith(7);
  });

  it("被冻结用户会抛出 AccountFrozen", async () => {
    queryMock.getValidUserSampleInfoByUserId.mockResolvedValue({ id: 7, nickname: "tester", is_deleted: true });
    const createError = vi.fn(({ code, message }) => new Error(`${code}:${message}`));
    const { userInfo } = createUserInfo({ createError });

    await expect(userInfo.getValidUserSampleInfo()).rejects.toThrow(`${ERRORS.AccountFrozen}:账号已被冻结`);
    expect(createError).toHaveBeenCalledWith({ code: ERRORS.AccountFrozen, message: "账号已被冻结" });
  });
});
export interface CreateUserInfoOptions extends Partial<HttpUserConfig> {
  accessToken?: string;
  verifyAccessToken: (token: string) => Promise<AccessToken<AccessUserData>>;
}
export function createHttpUserInfo(options: CreateUserInfoOptions): HttpUserInfo {
  const { rootRoleId, createError, verifyAccessToken, accessToken } = options;
  const jwtAuth = new JWTAuth({
    verifyAccessToken,
    accessToken,
    createError,
  });
  return new HttpUserInfo(jwtAuth, { rootRoleId, createError });
}

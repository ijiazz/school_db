import { describe, expect, it, vi } from "vitest";
import { AccessToken, ERRORS, JWTAuth } from "@/auth.ts";

describe("JWTAuth", () => {
  function createAccessToken<T>(option: {
    data: T;
    isExpired?: boolean;
    needRefresh?: boolean;
    refresh?: () => Promise<AccessToken<T>>;
  }): AccessToken<T> {
    return {
      token: "token-value",
      maxAge: null,
      isExpired: option.isExpired ?? false,
      needRefresh: option.needRefresh ?? false,
      data: option.data,
      refresh: option.refresh ?? (() => Promise.resolve(undefined as never)),
    };
  }

  it("没有 access token 时 getJwtInfo 会抛出需要登录", async () => {
    const auth = new JWTAuth<{ userId: number }>({
      verifyAccessToken: vi.fn(),
    });

    await expect(auth.getJwtInfo()).rejects.toThrow("需要登录");
  });

  it("首次校验成功后会缓存令牌信息", async () => {
    const accessToken = createAccessToken({
      data: { userId: 1 },
    });
    const verifyAccessToken = vi.fn().mockResolvedValue(accessToken);
    const auth = new JWTAuth<{ userId: number }>({
      accessToken: "valid-token",
      verifyAccessToken,
    });

    await expect(auth.getJwtInfo()).resolves.toEqual({ userId: 1 });
    await expect(auth.getJwtInfo()).resolves.toEqual({ userId: 1 });
    await expect(auth.checkUpdateToken()).resolves.toEqual({});

    expect(verifyAccessToken).toHaveBeenCalledTimes(1);
    expect(verifyAccessToken).toHaveBeenCalledWith("valid-token");
  });

  it("校验 access token 失败时会映射为 RequiredLogin 错误", async () => {
    const verifyError = vi.fn(({ code, message }) => new Error(`${code}:${message}`));
    const auth = new JWTAuth<{ userId: number }>({
      accessToken: "invalid-token",
      verifyAccessToken: vi.fn().mockRejectedValue(new Error("boom")),
      verifyError,
    });

    await expect(auth.getJwtInfo()).rejects.toThrow(`${ERRORS.RequiredLogin}:未登录`);
    expect(verifyError).toHaveBeenCalledWith({ code: ERRORS.RequiredLogin, message: "未登录" });
  });

  it("已过期 token 会抛出 TokenExpired，并允许 checkUpdateToken 返回 needDelete", async () => {
    const verifyError = vi.fn(({ code, message }) => new Error(`${code}:${message}`));
    const auth = new JWTAuth<{ userId: number }>({
      accessToken: "expired-token",
      verifyAccessToken: vi.fn().mockResolvedValue(createAccessToken({
        data: { userId: 2 },
        isExpired: true,
      })),
      verifyError,
    });

    await expect(auth.getJwtInfo()).rejects.toThrow(`${ERRORS.TokenExpired}:身份认证已过期`);
    await expect(auth.checkUpdateToken()).resolves.toEqual({ needDelete: true });
    expect(verifyError).toHaveBeenCalledWith({ code: ERRORS.TokenExpired, message: "身份认证已过期" });
  });

  it("需要刷新时 checkUpdateToken 返回 needRefresh，refreshToken 调用底层 refresh", async () => {
    const refreshedToken = createAccessToken({
      data: { userId: 3 },
    });
    const refresh = vi.fn().mockResolvedValue(refreshedToken);
    const verifyAccessToken = vi.fn().mockResolvedValue(createAccessToken({
      data: { userId: 3 },
      needRefresh: true,
      refresh,
    }));
    const auth = new JWTAuth<{ userId: number }>({
      accessToken: "refresh-token",
      verifyAccessToken,
    });

    await auth.getJwtInfo();
    await expect(auth.checkUpdateToken()).resolves.toEqual({ needRefresh: true });
    await expect(auth.refreshToken()).resolves.toBe(refreshedToken);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(verifyAccessToken).toHaveBeenCalledTimes(1);
  });

  it("未完成校验前调用 refreshToken 会失败", async () => {
    const auth = new JWTAuth<{ userId: number }>({
      accessToken: "token",
      verifyAccessToken: vi.fn(),
    });

    await expect(auth.refreshToken()).rejects.toThrow("没有令牌信息可供刷新");
  });
});

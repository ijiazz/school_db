import { expect, test } from "vitest";
import { AuthToken, SignInfo } from "@/auth.ts";
import { afterTime } from "evlib";

async function signSysJWT(data: Record<string, any>): Promise<string> {
  return JSON.stringify(data);
}
async function parseSysJWT(accessToken: string): Promise<SignInfo<null>> {
  return JSON.parse(accessToken);
}

const authToken = new AuthToken<null>({
  parseSysJWT,
  signSysJWT,
});

const SignData = null;
test("version 不匹配，直接过期", async () => {
  const token = await signSysJWT(
    {
      data: undefined,
      issueTime: Math.floor(Date.now() / 1000),
      survivalSeconds: 1,
      version: AuthToken.version + 1,
    } satisfies SignInfo,
  );

  const result = await authToken.verifyAccessToken(token);
  expect(result.isExpired).toBe(true);
  expect(result.needRefresh).toBe(false);
});
test("无效 token 验证", async () => {
  await expect(() => authToken.verifyAccessToken("invalid.token.value")).rejects.toThrowError();
});

test("只存在 exp 如给 exp 过期直接过期", async () => {
  const liveMs = 100;
  const { token, maxAge } = await authToken.signAccessToken(SignData, { survivalSeconds: liveMs / 1000 });
  expect(maxAge).toBe(liveMs / 1000);
  {
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(false);
  }
  await afterTime(liveMs + 1);

  {
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
});

test("不会过期的 token 验证", async () => {
  {
    const { token, maxAge } = await authToken.signAccessToken(SignData, { survivalSeconds: 0 });
    expect(maxAge).toBeNull();
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(false);
  }
  {
    const { token } = await authToken.signAccessToken(SignData);
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(false);
  }
});

test("设置在期限内令牌刷新", async function () {
  const liveMs = 100;
  const { token, maxAge } = await authToken.signAccessToken(SignData, {
    survivalSeconds: liveMs / 1000,
    refreshSurvivalSeconds: 1,
  });
  expect(maxAge).greaterThan(0);
  await afterTime(liveMs + 1);
  {
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
  }

  await afterTime(liveMs);
  {
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
  }
  await afterTime(800);
  {
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
});
test("refreshAccessToken 只更新颁发时间", async function () {
  const liveMs = 100;
  const { token } = await authToken.signAccessToken(SignData, {
    survivalSeconds: liveMs / 1000,
    refreshKeepAliveSeconds: 0.5,
  }); // 500 毫秒内保活
  await afterTime(200);
  const result = await authToken.verifyAccessToken(token);
  let { token: token2 } = await result.refresh();

  const info2 = await parseSysJWT(token2);
  const { issueTime: t1, ...infoReset } = await parseSysJWT(token);
  const { issueTime: t2, ...info2Reset } = info2;
  expect(infoReset).toEqual(info2Reset);
  expect(t2, "refreshAccessToken 只更新颁发时间").greaterThan(t1);
});
test("设置需要保活的令牌刷新", async function () {
  const liveMs = 100;
  const { token, maxAge } = await authToken.signAccessToken(SignData, {
    survivalSeconds: liveMs / 1000,
    refreshKeepAliveSeconds: 0.5,
  }); // 500 毫秒内保活

  expect(maxAge).toBe(0.5);
  await afterTime(200);
  const result = await authToken.verifyAccessToken(token);
  expect(result.isExpired).toBe(false);
  expect(result.needRefresh).toBe(true);
  let { token: token2 } = await result.refresh();

  await afterTime(300);

  {
    const result = await authToken.verifyAccessToken(token); // 超过保活时间
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
  {
    const result = await authToken.verifyAccessToken(token2);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
  }
});

test("同时设置了 refreshKeepAliveSeconds 和 refreshSurvivalSeconds", async function () {
  const liveMs = 100;
  let { token, maxAge } = await authToken.signAccessToken(SignData, {
    survivalSeconds: liveMs / 1000,
    refreshKeepAliveSeconds: 0.5,
    refreshSurvivalSeconds: 1,
  }); // 500 毫秒内保活。2秒内可刷新
  expect(maxAge).greaterThan(0);
  {
    await afterTime(400);
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
    token = await result.refresh().then((res) => res.token);
  }
  {
    await afterTime(400); //800
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
    token = await result.refresh().then((res) => res.token);
  }
  {
    await afterTime(400); //1200
    const result = await authToken.verifyAccessToken(token);
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
});

test("refreshSurvivalSeconds 如果小于 refreshKeepAliveSeconds 应抛出异常", async function () {
  await expect(() =>
    authToken.signAccessToken(SignData, {
      refreshKeepAliveSeconds: 200,
      refreshSurvivalSeconds: 100,
    })
  ).rejects.toThrowError("refreshSurvivalSeconds must be greater than refreshKeepAliveSeconds");
});

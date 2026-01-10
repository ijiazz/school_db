export async function hashPwd(pwd: string, salt: string = "") {
  const data = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(salt + pwd));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16);
  }
  return str;
}

export class AuthToken<Data = void> {
  static readonly version = 1;
  constructor(
    options: {
      signSysJWT: (data: SignInfo<unknown>) => Promise<string>;
      parseSysJWT: (accessToken: string) => Promise<SignInfo<Data>>;
    },
  ) {
    this.#signSysJWT = options.signSysJWT;
    this.#parserSysJWT = options.parseSysJWT;
  }
  #signSysJWT: (data: SignInfo<unknown>) => Promise<string>;
  #parserSysJWT: (accessToken: string) => Promise<SignInfo<Data>>;
  async signAccessToken(data: Data, option: SignAccessTokenOption = {}): Promise<AccessToken> {
    const signTime = Date.now() / 1000;
    const { survivalSeconds, refreshKeepAliveSeconds, refreshSurvivalSeconds } = option;

    const body: SignInfo<Data> = { data: data, issueTime: signTime, version: AuthToken.version };

    if (typeof survivalSeconds === "number") body.survivalSeconds = survivalSeconds;

    if (refreshKeepAliveSeconds || refreshSurvivalSeconds) {
      body.refresh = {};
      if (typeof refreshKeepAliveSeconds === "number") {
        body.refresh.keepAliveSeconds = refreshKeepAliveSeconds;
      }
      if (typeof refreshSurvivalSeconds === "number") {
        if (refreshKeepAliveSeconds && refreshSurvivalSeconds < refreshKeepAliveSeconds) {
          throw new Error("refreshSurvivalSeconds must be greater than refreshKeepAliveSeconds");
        }
        body.refresh.exp = signTime + refreshSurvivalSeconds;
      }
    }
    const token = await this.#signSysJWT(body);

    return new AccessTokenImpl(this.#signSysJWT, body, token);
  }

  async verifyAccessToken(accessToken: string): Promise<AccessToken> {
    const data: SignInfo<Data> = await this.#parserSysJWT(accessToken);
    return new AccessTokenImpl(this.#signSysJWT, data, accessToken);
  }
}

export type SignInfo<T = void> = {
  data: T;
  /**
   * 令牌存活秒数。
   * 如果不存在，则没有过期时间
   */
  survivalSeconds?: number;
  /** 签发时间，时间戳。整数部分精确到秒 */
  issueTime: number;

  /** 令牌刷新 */
  refresh?: {
    /**
     * 刷新令牌存活时间，单位秒，相对于 signTime。超过这个时间，不允许刷新。也就是说，必须在这个时间内容使用过刷新令牌，用于保活
     * 如果不存在，则没有刷新时间
     */
    keepAliveSeconds?: number;
    /** 刷新令牌存活时间, 单位秒。如果不存在，则没有期限。它必须大于 keepAliveSeconds */
    exp?: number;
  };
  /** 令牌版本号 */
  version: number;
};

export type SignAccessTokenOption = {
  survivalSeconds?: number; // 访问令牌存活时间

  refreshKeepAliveSeconds?: number; // 可选的访问令牌刷新间隔时间
  refreshSurvivalSeconds?: number; // 可选的刷新令牌存活时间
};

export interface AccessToken {
  /** 访问令牌字符串 */
  readonly token: string;
  /** 令牌最大存活时间，单位秒 */
  readonly maxAge: number | null;
  /** 令牌是否已过期. 如果为 false, 则 needRefresh 必定为 false */
  readonly isExpired: boolean;
  /** 令牌是否需要刷新，如果为 true，则 isExpired 必定为 false */
  readonly needRefresh: boolean;
  refresh(): Promise<AccessToken>;
}
class AccessTokenImpl implements AccessToken {
  constructor(
    signSysJWT: (data: SignInfo<unknown>) => Promise<string>,
    signInfo: SignInfo<unknown>,
    readonly token: string,
  ) {
    this.#signSysJWT = signSysJWT;
    this.#signInfo = signInfo;
  }
  #signSysJWT: (data: SignInfo<unknown>) => Promise<string>;
  #signInfo: SignInfo<unknown>;

  #maxAge: number | null | undefined;
  get maxAge(): number | null {
    if (this.#maxAge === undefined) {
      this.#maxAge = getMaxAge(this.#signInfo) ?? null;
    }
    return this.#maxAge;
  }

  #verify?: ReturnType<typeof verifySignInfo>;
  get isExpired() {
    if (this.#verify === undefined) {
      this.#verify = verifySignInfo(this.#signInfo, AuthToken.version);
    }
    return this.#verify.isExpired;
  }

  get needRefresh() {
    if (this.#verify === undefined) {
      this.#verify = verifySignInfo(this.#signInfo, AuthToken.version);
    }
    return this.#verify.needRefresh;
  }

  async refresh(): Promise<AccessToken> {
    const body = { ...this.#signInfo, issueTime: Date.now() / 1000 } satisfies SignInfo<unknown>;
    const token = await this.#signSysJWT(body);

    return new AccessTokenImpl(this.#signSysJWT, body, token);
  }
}

function verifySignInfo(
  data: SignInfo<unknown>,
  requiredVersion: number,
): { isExpired: boolean; needRefresh: boolean } {
  if (typeof data.issueTime !== "number") throw new Error("缺少签名时间");

  const now = Date.now() / 1000;
  const refresh = data.refresh;
  const versionExpired = data.version !== requiredVersion;
  const isExpired = data.survivalSeconds && data.survivalSeconds + data.issueTime < now;

  const result: { isExpired: boolean; needRefresh: boolean } = {
    isExpired: !!isExpired || versionExpired,
    needRefresh: false,
  };
  if (isExpired && !versionExpired && refresh) {
    const refreshExpired = refresh.exp && refresh.exp < now;
    if (!refreshExpired) {
      const keepAliveExpired = refresh.keepAliveSeconds && refresh.keepAliveSeconds + data.issueTime < now;
      if (!keepAliveExpired) {
        result.needRefresh = true;
        result.isExpired = false; // 刷新令牌不算过期
      }
    }
  }

  return result;
}
function getMaxAge(info: SignInfo<unknown>): number | undefined {
  let maxAge: number | undefined;
  const refresh = info.refresh;
  if (info.survivalSeconds && refresh) {
    const refreshMaxAge = refresh.exp ? refresh.exp - Date.now() / 1000 : refresh.keepAliveSeconds; // 刷新令牌的最大存活时间
    if (refreshMaxAge) maxAge = Math.max(info.survivalSeconds, refreshMaxAge);
    else maxAge = info.survivalSeconds;
  } else {
    maxAge = info.survivalSeconds || undefined;
  }
  return maxAge;
}

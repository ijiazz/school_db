export function checkIjiaTokenData(raw: unknown) {
  const payload = raw as Record<string, unknown>;
  if (typeof payload !== "object" || payload === null) {
    throw new Error("无效的访问令牌负载");
  }

  switch (payload.type) {
    case AuthTokenType.User: {
      if (!Number.isSafeInteger(payload.userId)) {
        throw new Error("无效的访问令牌负载");
      }
      break;
    }
    case AuthTokenType.InternalMessage:
      break;

    default:
      throw new Error("不支持的访问令牌");
  }
  return payload as AccessJwtPayload;
}
export type AccessUserData = { type: AuthTokenType.User; userId: number };
export type AccessInternalData = { type: AuthTokenType.InternalMessage };
export type AccessJwtPayload = AccessUserData | AccessInternalData;

export enum AuthTokenType {
  User = "user",
  InternalMessage = "internalMessage",
}

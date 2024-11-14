import { ReadableStream } from "node:stream/web";
import { createHash } from "node:crypto";

export type HashAlgorithm = "md5" | "sha1" | "sha256";

/** 计算流的哈希 */
export async function execHash(algorithm: HashAlgorithm, stream: ReadableStream<Uint8Array>): Promise<string> {
  const hash = createHash(algorithm);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

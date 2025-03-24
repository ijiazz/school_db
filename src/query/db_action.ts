import { asset_audio, asset_image, asset_video, comment_image, user_avatar } from "../db.ts";
import { v } from "../yoursql.ts";
import type { SqlStatementDataset, YourTable } from "@asla/yoursql";
import { getBucket, getOSS, OssBucket } from "../oss.ts";
import { PromiseConcurrency } from "evlib/async";

type OssObjId = {
  bucket: string;
  objectName: string;
};
async function deleteOssObj(iter: AsyncGenerator<OssObjId[]>, options: { signal?: AbortSignal } = {}) {
  const { signal } = options;
  let aborted = false;
  let onAbort = () => {
    aborted = true;
  };
  if (signal) {
    signal.throwIfAborted();
    signal.addEventListener("abort", onAbort);
  }

  const batch = new PromiseConcurrency({ concurrency: 10, maxFailed: 3 });
  const oss = getOSS();
  const errors: Record<string, any> = {};
  function handler({ bucket, objectName }: OssObjId) {
    return oss.getBucket(bucket).deleteObject(objectName).catch((e) => {
      errors[bucket + "/" + objectName] = e;
      throw e;
    });
  }
  try {
    for await (const chunk of iter) {
      await batch.push(...chunk.map(handler));
      if (aborted) break;
    }
  } catch (e) {
    console.error("deleteOssObj()", "OSS 对象删除失败", errors);
    throw e;
  } finally {
    await batch.onClear();
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}
async function* iterQueryRows(
  sql: SqlStatementDataset<{ id: string }>,
  bucket: string,
): AsyncGenerator<OssObjId[], undefined, undefined> {
  let rows = await sql.queryRows();
  while (rows.length) {
    yield rows.map(({ id }) => ({ bucket, objectName: id }));
    rows = await sql.queryRows();
  }
}
export async function deleteCommentImageZero(option: { signal?: AbortSignal }) {
  const sql = comment_image
    .delete({
      where: "id IN (" + comment_image.select({ id: true }).where("ref_count=0").limit(10) + ")",
    })
    .returning<{ id: string }>({ id: true });
  await deleteOssObj(iterQueryRows(sql, getBucket().COMMENT_IMAGE), option);
}
export async function deleteUserAvatarZero(option: { signal?: AbortSignal }) {
  const sql = user_avatar
    .delete({ where: "id IN (" + user_avatar.select({ id: true }).where("ref_count=0").limit(10) + ")" })
    .returning<{ id: string }>({ id: true });
  await deleteOssObj(iterQueryRows(sql, getBucket().COMMENT_IMAGE), option);
}
async function deleteAssetResource(table: YourTable<any>, id: string | string[], bucket: OssBucket) {
  const sql = table
    .delete({
      where: () => {
        if (typeof id === "string") return "id=" + v(id);
        return "id IN (" + v.toValues(id) + ")";
      },
    })
    .returning<{ id: string }>({ id: true });
  const rows = await sql.queryRows();
  let set = new Set<string>();
  for (const item of rows) set.add(item.id);
  const failed = await bucket.deleteObjectMany(set);
  if (failed.size) {
    console.error("DbResourceDelete.#deleteAssetResource()", "OSS 对象删除失败", Object.fromEntries(failed));
  }
}
export function deleteAssetVideo(videoId: string | string[]) {
  return deleteAssetResource(asset_video, videoId, getOSS().getBucket(getBucket().ASSET_VIDEO));
}
export function deleteAssetImage(videoId: string | string[]) {
  return deleteAssetResource(asset_image, videoId, getOSS().getBucket(getBucket().ASSET_VIDEO));
}
export function deleteAssetAudio(videoId: string | string[]) {
  return deleteAssetResource(asset_audio, videoId, getOSS().getBucket(getBucket().ASSET_VIDEO));
}

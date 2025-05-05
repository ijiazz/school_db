import { comment_image, pla_asset_media, user_avatar } from "../db.ts";
import { dbPool, v } from "../yoursql.ts";
import type { SqlStatementDataset } from "@asla/yoursql";
import { getBucket, getOSS } from "../oss.ts";
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
export async function deleteAssetMedia(id: string | string[]) {
  const pool = dbPool.begin();

  const sql = pla_asset_media
    .delete({
      where: () => {
        if (typeof id === "string") return "id=" + v(id);
        return "id IN (" + v.toValues(id) + ")";
      },
    })
    .returning<{ file_id: string; ext: string | null }>({
      ext: true,
      file_id: true,
    });
  const rows = await pool.queryRows(sql);

  const failedAll = new Map<string, any>();

  const bucket = getOSS().getBucket(getBucket().PLA_POST_MEDIA);
  const keys = new Set<string>();
  for (const { ext, file_id } of rows) {
    const file = ext ? file_id + "." + ext : file_id;
    keys.add(file);
  }
  const failed = await bucket.deleteObjectMany(keys);
  for (const [k, v] of failed) {
    failedAll.set(k, v);
  }

  await pool.commit();

  if (failedAll.size) {
    console.error("DbResourceDelete.#deleteAssetResource()", "OSS 对象删除失败", Object.fromEntries(failedAll));
  }
}

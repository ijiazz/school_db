import {
  getClient,
  comment_image,
  DbTransactionQuery,
  user_avatar,
  v,
  asset_video,
  asset_image,
  asset_audio,
} from "../db.ts";
import { SqlQueryStatement, YourTable } from "@asla/yoursql";
import { getOOS, getBucket, OOS } from "../oos.ts";
import { PromiseConcurrency } from "evlib/async";

type OosObjId = {
  bucket: string;
  objectName: string;
};
export class DbResourceDelete {
  #oos: OOS;
  #db: DbTransactionQuery;
  constructor(option: { oos?: OOS; client?: DbTransactionQuery }) {
    this.#oos = option.oos ?? getOOS();
    this.#db = option.client ?? getClient();
  }
  async #deleteOosObj(iter: AsyncGenerator<OosObjId[]>, options: { signal?: AbortSignal } = {}) {
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
    const oos = this.#oos;
    const errors: Record<string, any> = {};
    function handler({ bucket, objectName }: OosObjId) {
      return oos.deleteObject(bucket, objectName).catch((e) => {
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
      console.error("DbResourceDelete.#deleteOosObj()", "OOS 对象删除失败", errors);
      throw e;
    } finally {
      await batch.onClear();
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }
  async *#iterQueryRows(
    sql: SqlQueryStatement<{ id: string }>,
    bucket: string
  ): AsyncGenerator<OosObjId[], undefined, undefined> {
    let rows = await this.#db.queryRows(sql);
    while (rows.length) {
      yield rows.map(({ id }) => ({ bucket, objectName: id }));
      rows = await this.#db.queryRows(sql);
    }
  }
  async deleteCommentImageZero(option: { signal?: AbortSignal }) {
    const sql = comment_image.deleteWithResult(
      { id: true },
      { where: "id IN (" + comment_image.select({ id: true }).where("ref_count=0").limit(10) + ")" }
    ) as SqlQueryStatement<{ id: string }>;
    await this.#deleteOosObj(this.#iterQueryRows(sql, getBucket().COMMENT_IMAGE), option);
  }
  async deleteUserAvatarZero(option: { signal?: AbortSignal }) {
    const sql = user_avatar.deleteWithResult(
      { id: true },
      { where: "id IN (" + user_avatar.select({ id: true }).where("ref_count=0").limit(10) + ")" }
    ) as SqlQueryStatement<{ id: string }>;
    await this.#deleteOosObj(this.#iterQueryRows(sql, getBucket().COMMENT_IMAGE), option);
  }
  async #deleteAssetResource(table: YourTable<any>, id: string | string[], bucket: string) {
    const sql = table.deleteWithResult(
      { id: true },
      {
        where: () => {
          if (typeof id === "string") return "id=" + v(id);
          return "id IN (" + v.toValues(id) + ")";
        },
      }
    );
    const rows = await this.#db.queryRows<{ id: string }>(sql);
    let set = new Set<string>();
    for (const item of rows) set.add(item.id);
    const failed = await this.#oos.deleteObjectMany(bucket, set);
    if (failed.size) {
      console.error("DbResourceDelete.#deleteAssetResource()", "OOS 对象删除失败", Object.fromEntries(failed));
    }
  }
  deleteAssetVideo(videoId: string | string[]) {
    return this.#deleteAssetResource(asset_video, videoId, getBucket().ASSET_VIDEO);
  }
  deleteAssetImage(videoId: string | string[]) {
    return this.#deleteAssetResource(asset_image, videoId, getBucket().ASSET_VIDEO);
  }
  deleteAssetAudio(videoId: string | string[]) {
    return this.#deleteAssetResource(asset_audio, videoId, getBucket().ASSET_VIDEO);
  }
}

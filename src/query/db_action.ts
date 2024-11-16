import { getDbUrl, getClient, DbCursor, comment_image, DbTransactionQuery } from "../db.ts";
import { YourTable } from "@asla/yoursql";
import { getOOS, getBucket, OOS } from "../oos.ts";
import { ConcurrencyControl } from "../common/batch_async.ts";

class DbResourceDelete {
  #oos: OOS;
  #db: DbTransactionQuery;
  constructor(option: { oos?: OOS; client?: DbTransactionQuery }) {
    this.#oos = option.oos ?? getOOS();
    this.#db = option.client ?? getClient();
  }
  async deleteCommentImage(option: { zero?: boolean }) {
    const sql = comment_image.deleteWithResult({ id: true }).where();
    const client = this.#db;
    const oos = this.#oos;
    const bucket = getBucket().COMMENT_IMAGE;
    const batch = new ConcurrencyControl({ concurrency: 10, maxFailed: 3 });
    function handler(item: { id: string }) {
      return oos.deleteObject(bucket, item.id).catch((e) => {
        throw e;
      });
    }
    for await (const chunk of client.cursorEachChunk(sql, 20)) {
      await batch.push(...chunk.map(handler));
    }
  }
  async deleteUserAvatar() {}
  async deletePublishedVideo() {}
  async deletePublishedImage() {}
  async deletePublishedAudio() {}
}

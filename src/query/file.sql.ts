import { AudioFileMeta, DbSysFileCreate, ImageFileMeta, MediaFileMeta, MediaType, VideoFileMeta } from "@ijia/data/db";
import { deleteFrom, v } from "@asla/yoursql";
import type { DbTransaction } from "@asla/yoursql/client";
import { insertIntoValues } from "../common/sql.ts";
import { dbPool } from "../common/dbclient.ts";
import { getOssBucket } from "@ijia/data/oss";

export async function beginCreateFileTransaction<T>(
  sourceFilePath: string,
  inputFile: DbSysFileCreate,
  run: (t: DbTransaction, ctrl: { cancel: () => void }) => Promise<T>,
): Promise<T> {
  const file = checkFile(inputFile);

  const bucket = getOssBucket(file.bucket);

  const deleteRecordSql = deleteFrom("sys.file_operation").where([
    `bucket = ${v(file.bucket)}`,
    `filename = ${v(file.filename)}`,
  ]);
  using conn = await dbPool.connect();

  await using t = dbPool.begin("READ COMMITTED");

  await t.execute(insertIntoValues("sys.file", file));
  let cancelled = false;
  const result = await run(t, {
    cancel: () => {
      cancelled = true;
    },
  });
  if (!cancelled) {
    try {
      await conn.execute(insertIntoValues("sys.file_operation", {
        bucket: file.bucket,
        filename: file.filename,
        to_bucket: file.bucket,
        to_path: file.filename,
      })); //用另一个链接写入日志，在完成或失败后删除日志
    } catch (error) {
      console.error("遗留文件事务记录导致新的文件事务执行失败，需要尽快处理日志", error);
      throw error;
    }

    try {
      await bucket.fMoveInto(file.filename, sourceFilePath);
    } catch (error) {
      await conn.execute(deleteRecordSql); // 删除日志
      throw error;
    }
  }
  conn.release();

  await t.execute(deleteRecordSql); // 删除日志
  await t.commit();
  return result;
}
function checkFile(file: DbSysFileCreate): DbSysFileCreate {
  const { media_type } = file;
  return {
    bucket: file.bucket,
    filename: file.filename,
    media_type: file.media_type,
    hash: file.hash,
    size: file.size,
    meta: checkFileMeta(media_type, file.meta),
  };
}
function checkFileMeta(mediaType: MediaType | undefined | null, meta: MediaFileMeta): MediaFileMeta {
  switch (mediaType) {
    case MediaType.image: {
      const m = meta as ImageFileMeta;
      return {
        width: nonnegativeInteger(m.width),
        height: nonnegativeInteger(m.height),
      } satisfies ImageFileMeta;
    }
    case MediaType.video: {
      const m = meta as VideoFileMeta;

      return {
        height: nonnegativeInteger(m.height),
        width: nonnegativeInteger(m.width),
        format: optionalString(m.format),
        bit_rate: optionalNonnegativeInteger(m.bit_rate),
        fps: optionalNonnegativeInteger(m.fps),
        frame_num: optionalNonnegativeInteger(m.frame_num),
      } satisfies VideoFileMeta;
    }
    case MediaType.audio: {
      const m = meta as AudioFileMeta;
      return {
        duration: nonnegativeInteger(m.duration),
        format: optionalString(m.format),
      } satisfies AudioFileMeta;
    }
    default:
      throw new Error("unknown media type " + mediaType);
  }
}
function nonnegativeInteger(value: unknown): number {
  if (Number.isSafeInteger(value) && (value as number) > 0) {
    return value as number;
  } else {
    throw new Error("invalid asset meta");
  }
}
function optionalNonnegativeInteger(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  return nonnegativeInteger(value);
}
function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  throw new Error("invalid asset meta");
}

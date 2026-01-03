import { dbPool } from "@/common/dbclient.ts";
import { test } from "../../fixtures/db_connect.ts";
import { insertIntoValues, v } from "@/common/sql.ts";
import { expect } from "vitest";
import type { DbSysFileCreate } from "@ijia/data/db";

let id = 0;
function genId(prefix: string) {
  return `${prefix}${id++}`;
}

test("add count", async function ({ publicDbPool }) {
  const bucket = genId("bucket");
  const filename = genId("filename");
  await addFile(bucket, filename);
  await expect(file_update_ref_count(null, null, bucket, filename)).resolves.toBe(1);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(1);

  await expect(file_update_ref_count(null, `${bucket}/${filename}`)).resolves.toBe(1);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(2);
});
test("delete count", async function ({ publicDbPool }) {
  const bucket = genId("bucket");
  const filename = genId("filename");
  await addFile(bucket, filename);
  await expect(file_update_ref_count(bucket, filename, null, null)).resolves.toBe(1);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(-1);

  await expect(file_update_ref_count(`${bucket}/${filename}`, null)).resolves.toBe(1);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(-2);
});
test("change count no op", async function ({ publicDbPool }) {
  const bucket1 = genId("bucket");
  const filename1 = genId("filename");
  const bucket2 = genId("bucket");
  const filename2 = genId("filename");
  await addFile(bucket1, filename1);
  await addFile(bucket2, filename2);

  await expect(file_update_ref_count(bucket1, filename1, bucket2, filename2)).resolves.toBe(2);
  await expect(getFileRefCount(bucket1, filename1)).resolves.toBe(-1);
  await expect(getFileRefCount(bucket2, filename2)).resolves.toBe(1);

  await expect(file_update_ref_count(`${bucket1}/${filename1}`, `${bucket2}/${filename2}`)).resolves.toBe(2);
  await expect(getFileRefCount(bucket1, filename1)).resolves.toBe(-2);
  await expect(getFileRefCount(bucket2, filename2)).resolves.toBe(2);
});

test("no change count", async function ({ publicDbPool }) {
  const bucket = genId("bucket");
  const filename = genId("filename");
  await addFile(bucket, filename);

  await expect(file_update_ref_count(bucket, filename, bucket, filename)).resolves.toBe(0);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(0);
  await expect(file_update_ref_count(null, null, null, null)).resolves.toBe(0);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(0);

  await expect(file_update_ref_count(`${bucket}/${filename}`, `${bucket}/${filename}`)).resolves.toBe(0);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(0);

  await expect(file_update_ref_count(null, null)).resolves.toBe(0);
  await expect(getFileRefCount(bucket, filename)).resolves.toBe(0);
});

test("filename 存在时, bucket 不能为 null", async function ({ publicDbPool }) {
  const bucket1 = genId("bucket");
  const filename1 = genId("filename");
  const bucket2 = genId("bucket");
  const filename2 = genId("filename");
  await addFile(bucket1, filename1);
  await addFile(bucket2, filename2);

  await expect(file_update_ref_count(null, filename1, bucket1, filename2)).rejects.toThrow();

  await expect(file_update_ref_count(bucket1, filename1, null, filename2)).rejects.toThrow();

  await expect(file_update_ref_count(bucket1, null, bucket2, filename2)).resolves.toBe(1);
  await expect(file_update_ref_count(bucket1, filename1, bucket1, null), "只判断 filename").resolves.toBe(1);
});
test("旧文件不存在则跳过", async function ({ publicDbPool }) {
});
test("校验 bucket 和 filename", async function ({ publicDbPool }) {
  await expect(file_update_ref_count(null, "/bucket/filename")).rejects.toThrow();
  await expect(file_update_ref_count(null, "/bucket//filename")).rejects.toThrow();
  await expect(file_update_ref_count(null, "bucket/filename/")).rejects.toThrow();
  await expect(file_update_ref_count(null, "bucket/")).rejects.toThrow();
  await expect(file_update_ref_count(null, "/bucket")).rejects.toThrow();
  await expect(file_update_ref_count(null, "")).rejects.toThrow();
  await expect(file_update_ref_count(null, "//")).rejects.toThrow();
  await expect(file_update_ref_count(null, "/")).rejects.toThrow();

  const bucket = `${genId("bucket")}/2`;
  const filename = genId("filename");
  await addFile(bucket, filename);
  await expect(file_update_ref_count(`${bucket}/${filename}`, null)).resolves.toBe(1);
});
test("更新未知文件引用计数", async function ({ publicDbPool }) {
  await expect(file_update_ref_count("bucket", "filename", null, null), "允许旧文件不存在").resolves.toBe(0);
  await expect(file_update_ref_count(null, null, "bucket", "filename"), "不允许新文件不存在").rejects.toThrow();
  await expect(file_update_ref_count("bucket1", "filename1", "bucket2", "filename2"), "不允许新文件不存在").rejects
    .toThrow();
});

function file_update_ref_count(
  old_filepath: string | null,
  new_filepath: string | null,
): Promise<number>;
function file_update_ref_count(
  old_bucket: string | null,
  old_filename: string | null,
  new_bucket: string | null,
  new_filename: string | null,
): Promise<number>;
async function file_update_ref_count(
  old_bucket: string | null,
  old_filename: string | null,
  new_bucket?: string | null,
  new_filename?: string | null,
) {
  const sql = new_bucket === undefined && new_filename === undefined
    ? `SELECT sys.file_update_ref_count(${v(old_bucket)}, ${v(old_filename)}) AS count`
    : `SELECT sys.file_update_ref_count(${v(old_bucket)}, ${v(old_filename)}, ${v(new_bucket)}, ${
      v(new_filename)
    }) AS count`;

  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);
  return count;
}

async function getFileRefCount(bucket: string, filename: string) {
  const sql = `SELECT ref_count FROM sys.file WHERE bucket=${v(bucket)} AND filename=${v(filename)}`;
  const row = await dbPool.queryFirstRow<{ ref_count: number }>(sql);
  return row.ref_count;
}
async function addFile(bucket: string, filename: string, size = 0) {
  await dbPool.execute(
    insertIntoValues("sys.file", { bucket, filename, size, hash: "", meta: {} } satisfies DbSysFileCreate<object>),
  );
}

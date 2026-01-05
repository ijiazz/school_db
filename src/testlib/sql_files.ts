import path from "node:path";
import fs from "node:fs/promises";
const dirname = import.meta.dirname!;
const SQL_DIR = path.resolve(dirname, "../../sql"); //path.resolve("db/sql");

const MERGE_SQL_FILE = path.join(SQL_DIR, "init.sql");
const IJIA_DB_SQL_BASE_DIR = SQL_DIR + "/init";

const IJIA_DB_SQL_FILES = [
  "function",

  "table/sys/init.sql",
  "table/sys/tables_file.sql",
  "table/sys/tables_system.sql",

  "table/pla/init.sql",
  "table/pla/tables_assets.sql",
  "table/pla/tables_comment.sql",

  "table/public/tables_user.sql",
  "table/public/tables_post.sql",
  "table/public/tables_post_comment.sql",

  "query",
];

export async function* getSQLInitFiles(): AsyncIterable<string> {
  for (const fileName of IJIA_DB_SQL_FILES) {
    const fullPath = path.join(IJIA_DB_SQL_BASE_DIR, fileName);
    yield* readDirSqlFiles(fullPath);
  }
}

async function* readDirSqlFiles(dir: string): AsyncIterable<string> {
  const stat = await fs.stat(dir);
  if (!stat.isDirectory()) {
    if (dir.endsWith(".sql")) {
      yield dir;
    }
    return;
  }
  const files = await fs.readdir(dir).catch((e) => {
    if (e?.code === "ENOENT") return [];
    throw e;
  });
  for (const file of files) {
    const absPath = path.join(dir, file);
    const stat = await fs.stat(absPath);
    if (stat.isDirectory()) {
      yield* readDirSqlFiles(absPath);
      continue;
    } else if (stat.isFile() && file.endsWith(".sql")) {
      yield absPath;
    }
  }
}
export async function getMergedFiles() {
  const stat = await fs.stat(MERGE_SQL_FILE);
  if (!stat.isFile()) {
    throw new Error(`合并的 SQL 文件不存在，请确保你已生成合并的 SQL 文件: ${MERGE_SQL_FILE}`);
  }
  return fs.readFile(MERGE_SQL_FILE, "utf-8");
}

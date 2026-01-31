import path from "node:path";
import fs from "node:fs/promises";
import type { Stats } from "node:fs";
const dirname = import.meta.dirname!;
const SQL_DIR = path.resolve(dirname, "../../sql"); //path.resolve("db/sql");

const MERGE_SQL_FILE = path.join(SQL_DIR, "init.sql");
const IJIA_DB_SQL_BASE_DIR = SQL_DIR + "/init";

export async function* getSQLInitFiles(): AsyncIterable<string> {
  const sqFile = path.join(IJIA_DB_SQL_BASE_DIR, "sq.txt"); //顺序文件
  const text = await fs.readFile(sqFile, "utf-8");

  const functionsDir = path.join(IJIA_DB_SQL_BASE_DIR, "function");
  const queryDir = path.join(IJIA_DB_SQL_BASE_DIR, "query");

  yield* readDirSqlFiles(functionsDir);
  for (const sqlFile of text.split(/[\n\r]+/)) {
    const filePath = sqlFile.trim();
    if (!filePath) {
      continue;
    }
    yield path.join(IJIA_DB_SQL_BASE_DIR, filePath);
  }
  yield* readDirSqlFiles(queryDir);
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
  let stat: Stats;
  try {
    stat = await fs.stat(MERGE_SQL_FILE);
    if (!stat.isFile()) {
      throw new Error(`合并的 SQL 文件不存在，请确保你已生成合并的 SQL 文件: ${MERGE_SQL_FILE}`);
    }
  } catch (error) {
    throw new Error(`合并的 SQL 文件不存在，请确保你已生成合并的 SQL 文件: ${MERGE_SQL_FILE}`);
  }

  return fs.readFile(MERGE_SQL_FILE, "utf-8");
}

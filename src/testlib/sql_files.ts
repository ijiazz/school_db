import path from "node:path";
import fs from "node:fs/promises";
const dirname = import.meta.dirname!;
const SQL_DIR = path.resolve(dirname, "../../sql"); //path.resolve("db/sql");

const IJIA_DB_SQL_BASE_DIR = SQL_DIR + "/init";
const IJIA_DB_SQL_FILES = [
  "functions.sql",
  "tables_system.sql",
  "tables_assets.sql",
  "tables_user.sql",
  "tables_post.sql",
  "tables_post_comment.sql",
];

export async function* getSQLInitFiles(extra = false): AsyncIterable<string> {
  for (const fileName of IJIA_DB_SQL_FILES) {
    yield path.join(IJIA_DB_SQL_BASE_DIR, fileName);
  }
  if (extra) {
    yield* readDirSqlFiles(path.join(IJIA_DB_SQL_BASE_DIR, "extra"));
  }

  yield* readDirSqlFiles(path.join(SQL_DIR, "functions"));
}

async function* readDirSqlFiles(dir: string): AsyncIterable<string> {
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

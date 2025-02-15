import { createPgClient, DbConnection, DbConnectOption, DbQuery } from "../yoursql.ts";
import path from "node:path";
import fs from "node:fs/promises";
const dirname = import.meta.dirname!;
const SQL_DIR = path.resolve(dirname, "../../sql"); //path.resolve("db/sql");
/**
 * 初始化数据库
 */
async function initIjiaDb(client: DbQuery, option: { extra?: boolean } = {}): Promise<void> {
  const sqlInitDir = SQL_DIR + "/init";
  const sqlFiles: string[] = ["create_functions.sql", "create_tables.sql"];

  if (option.extra) {
    const extraDirName = "extra";
    const extraFiles = await fs.readdir(path.join(sqlInitDir, extraDirName)).then((dir) => dir, (e) => {
      if (e?.code === "ENOENT") {
        return [];
      }
      throw e;
    });
    for (const item of extraFiles) {
      sqlFiles.push(extraDirName + "/" + item);
    }
  }

  for (const relSqlFile of sqlFiles) {
    const sqlFile = path.resolve(sqlInitDir, relSqlFile);
    try {
      await execSqlFile(sqlFile, client);
    } catch (error) {
      throw new Error(`初始化数据库失败(${sqlFile})`, { cause: error });
    }
  }
}
/**
 * 创建并初始化 ijia_db
 * @param connect 必须提供一个数据库连接，用于执行SQL语句创建数据库
 */
export async function createInitIjiaDb(connect: DbConnectOption | URL, dbname: string, option: {
  /** user 用于连接数据库，也将成为新建数据库的 owner */
  owner?: string;
  dropIfExists?: boolean;
  /** 是否启用扩展功能 */
  extra?: boolean;
} = {}): Promise<void> {
  const pgClient = await createPgClient(connect);
  try {
    if (option.dropIfExists) await pgClient.query(`DROP DATABASE IF EXISTS ${dbname}`);
    await createDb(pgClient, dbname, { owner: option.owner });
  } finally {
    await pgClient.close();
  }
  await using client = await createPgClient({ ...connect, database: dbname });
  await initIjiaDb(client, { extra: true });
}

/**
 * 清空传入连接的数据库的所有表的所有数据
 */
export async function clearAllTablesData(client: DbQuery) {
  await client.query(`DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema'))
    LOOP
        EXECUTE 'TRUNCATE public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
 `);
}
export class DbManage {
  constructor(readonly dbClient: DbConnection) {
  }
  /** 删除 dbAddr 对应数据库 */
  createDb(dbName: string, option: CreateDataBaseOption = {}) {
    return createDb(this.dbClient, dbName, option);
  }
  /** 删除 dbAddr 对应数据库 */
  async dropDb(dbName: string) {
    await this.dbClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
  }
  async copy(templateDbName: string, newDbName: string) {
    const client = this.dbClient;
    await client.query(`DROP DATABASE IF EXISTS ${newDbName}`);
    await client.query(`CREATE DATABASE ${newDbName} WITH TEMPLATE ${templateDbName}`);
  }
  close() {
    return this.dbClient.close();
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
}
export interface CreateDataBaseOption {
  owner?: string;
}
async function createDb(dbQuery: DbQuery, dbName: string, option: CreateDataBaseOption = {}) {
  await dbQuery.query(`
CREATE DATABASE ${dbName}
WITH
${option.owner ? "OWNER=" + option.owner : ""}
ENCODING = 'UTF8'
LOCALE_PROVIDER = 'libc'
CONNECTION LIMIT = -1
IS_TEMPLATE = False;
  `);
}

async function execSqlFile(pathname: string, client: DbQuery) {
  const file = await fs.readFile(pathname, "utf-8");
  return client.query(file);
}

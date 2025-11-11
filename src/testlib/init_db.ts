import { createDbConnection, DbConnection, DbConnectOption, DbQuery, parserDbUrl } from "../dbclient.ts";
import fs from "node:fs/promises";
import { DatabaseError } from "../common/pg.ts";
import { genPgSqlErrorMsg, v } from "../common/sql.ts";
import { createUser } from "../query/user.ts";
import { getSQLInitFiles } from "./sql_files.ts";

/**
 * 初始化数据库
 */
export async function initIjiaDb(client: DbQuery, option: { extra?: boolean } = {}): Promise<void> {
  for await (const sqlFile of getSQLInitFiles(option.extra)) {
    try {
      await execSqlFile(sqlFile, client);
    } catch (error) {
      throw new Error(`初始化数据库失败(${sqlFile})`, { cause: error });
    }
  }
}

export type CreateInitIjiaDbOption = {
  /** user 用于连接数据库，也将成为新建数据库的 owner。默认使用 connect url 的用户 */
  owner?: string;
  /** 如果为 true, 则如果 owner 不存在，则先创建 owner。这依赖 connect 的用户要拥有创建角色的权限 */
  ensureOwner?: boolean;
  /** 如为 true，则尝试删除同名数据库 */
  dropIfExists?: boolean;
  /** 是否启用扩展功能 */
  extra?: boolean;
  createTestUser?: boolean;
  /** 初始化测试用户 */
};
/**
 * 创建并初始化 ijia_db
 * @param connect 必须提供一个数据库连接，用于执行SQL语句创建数据库。要求这个连接用户拥有创建数据库的权限
 */
export async function createInitIjiaDb(
  connect: DbConnectOption | URL | string,
  dbname: string,
  option: CreateInitIjiaDbOption = {},
): Promise<void> {
  const { owner, ensureOwner, dropIfExists } = option;

  await using mange = await DbManage.connect(connect);
  if (dropIfExists) await mange.dropDb(dbname);
  if (owner) {
    if (ensureOwner) {
      const sql = `DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = ${v(owner)})
   THEN CREATE USER ${owner} WITH LOGIN;
   END IF;
END $$;`;
      await mange.dbClient.query(sql);
    }
  }

  await mange.createDb(dbname, { owner });

  let connConf: DbConnectOption;
  if (typeof connect === "object" && !(connect instanceof URL)) {
    connConf = { ...connect, database: dbname };
  } else {
    connConf = parserDbUrl(connect);
    connConf.database = dbname;
  }
  await using client = await createDbConnection(connConf);
  try {
    await initIjiaDb(client, { extra: true });
  } catch (error) {
    try {
      await client.close();
      await mange.dropDb(dbname);
    } catch (error) {}

    throw error;
  }

  if (option.createTestUser) {
    const sql = createUser("test@ijiazz.cn", { nickname: "测试", id: 1 });
    await client.queryRows(sql);
  }
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
  static async connect(url: string | URL | DbConnectOption) {
    const client = await createDbConnection(url);
    return new DbManage(client);
  }

  constructor(readonly dbClient: DbConnection) {}
  /** 删除 dbAddr 对应数据库 */
  async createDb(dbName: string, option: CreateDataBaseOption = {}) {
    const sql = genCreateDb(dbName, option);
    await this.dbClient.query(sql);
  }
  /** 删除 dbAddr 对应数据库 */
  async dropDb(dbName: string) {
    await this.dbClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
  }
  async copy(templateDbName: string, newDbName: string) {
    const client = this.dbClient;
    await this.dropDb(newDbName);
    await client.query(`CREATE DATABASE ${newDbName} WITH TEMPLATE ${templateDbName}`);
  }
  close() {
    return this.dbClient.close();
  }
  async recreateDb(dbName: string) {
    await this.dropDb(dbName);
    await this.createDb(dbName);
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
}
export interface CreateDataBaseOption {
  owner?: string;
}
function genCreateDb(dbName: string, option: CreateDataBaseOption = {}) {
  return `
CREATE DATABASE ${dbName}
WITH
${option.owner ? "OWNER=" + option.owner : ""}
ENCODING = 'UTF8'
LOCALE_PROVIDER = 'libc'
CONNECTION LIMIT = -1
IS_TEMPLATE = False;
  `;
}

async function execSqlFile(pathname: string, client: DbQuery): Promise<void> {
  const file = await fs.readFile(pathname, "utf-8");
  try {
    await client.query(file);
  } catch (error) {
    if (error instanceof DatabaseError) {
      const detail = genPgSqlErrorMsg(error, { sqlFileName: pathname, sqlText: file });
      error.message = `执行SQL文件失败:${error.message}\n${detail}`;
      throw error;
    } else {
      throw new Error(`执行SQL文件失败\n${pathname}`, { cause: error });
    }
  }
}

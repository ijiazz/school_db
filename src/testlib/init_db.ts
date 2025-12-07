import { v } from "../common/sql.ts";
import { createUser } from "../query/user.ts";
import { getSQLInitFiles } from "./sql_files.ts";
import { createDbConnection, DbConnectOption, DbManage, DbQuery, execSqlFile, parserDbConnectUrl } from "@asla/pg";

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
  const mange = await DbManage.connect(connect);
  try {
    await execCreateInitIjiaDb(mange, connect, dbname, option);
  } finally {
    mange.close();
  }
}
async function execCreateInitIjiaDb(
  mange: DbManage,
  connect: DbConnectOption | URL | string,
  dbname: string,
  option: CreateInitIjiaDbOption = {},
) {
  const { owner, ensureOwner, dropIfExists } = option;
  if (dropIfExists) await mange.dropDb(dbname);
  if (owner) {
    if (ensureOwner) {
      const sql = `DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = ${v(owner)})
   THEN CREATE USER ${owner} WITH LOGIN;
   END IF;
END $$;`;
      await mange.dbClient.multipleQuery(sql);
    }
  }

  await mange.createDb(dbname, { owner });

  let connConf: DbConnectOption;
  if (typeof connect === "object" && !(connect instanceof URL)) {
    connConf = { ...connect, database: dbname };
  } else {
    connConf = parserDbConnectUrl(connect);
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
  await client.multipleQuery(`DO $$
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

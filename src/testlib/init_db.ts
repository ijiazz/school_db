import { createPgDbClient, DbClient, DbConnectOption } from "../db.ts";
import path from "node:path";
import fs from "node:fs/promises";
const dirname = import.meta.dirname;
const SQL_DIR = path.resolve(dirname, "../../sql"); //path.resolve("db/sql");
/**
 * 初始化数据库
 */
async function initDb(client: DbClient): Promise<DbClient> {
  const sqlFiles: string[] = ["init/create_tables.sql", "init/create_functions.sql", "init/create_triggers.sql"];
  for (const sqlFile of sqlFiles) {
    try {
      await execSqlFile(path.resolve(SQL_DIR, sqlFile), client);
    } catch (error) {
      throw new Error(`初始化数据库失败(${sqlFile})`, { cause: error });
    }
  }
  return client;
}

/**
 * 清空所有表的所有数据
 */
export async function clearAllTablesData(client: DbClient) {
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
export async function copyDb(templateConnect: DbConnectOption, newName: string) {
  await using client = createPgDbClient({ ...templateConnect, database: "postgres" });
  await client.query(`DROP DATABASE IF EXISTS ${newName}`);
  await client.query(`CREATE DATABASE ${newName} WITH TEMPLATE ${templateConnect.database}`);
  return createPgDbClient({ ...templateConnect, database: newName });
}
export async function dropDb(dbAddr: DbConnectOption) {
  const dbName = dbAddr.database;
  await using client = createPgDbClient({ ...dbAddr, database: "postgres" });
  await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
}
async function execSqlFile(pathname: string, client: DbClient) {
  const file = await fs.readFile(pathname, "utf-8");
  return client.query(file);
}
/**
 *
 */
export async function createInitDb(
  createDb: {
    database: string;
    /** user 用于连接数据库，也将成为新建数据库的 owner */
    user: string;
    password?: string;
    hostname?: string;
    port?: number;
  },
  option: { dropIfExists?: boolean }
) {
  const owner = createDb.user;
  if (!owner) throw new Error("必须指定 user, 这将成为新数据库的 owner");
  const dbname = createDb.database;
  const pgClient = createPgDbClient({ ...createDb, database: "postgres" });

  try {
    if (option.dropIfExists) await pgClient.query(`DROP DATABASE IF EXISTS ${dbname}`);
    await pgClient.query(`
    CREATE DATABASE ${dbname}
    WITH
    OWNER = ${owner}
    ENCODING = 'UTF8'
    LOCALE_PROVIDER = 'libc'
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;
    `);
  } finally {
    await pgClient.end();
  }

  const client = createPgDbClient(createDb);
  try {
    await initDb(client);
  } catch (error) {
    await client.end();
    throw error;
  }
  return client;
}

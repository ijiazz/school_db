# School DB 项目约定

## 项目结构

- 这是一个以 Deno 为运行时、PostgreSQL 为数据源的 TypeScript 库。依赖、导入映射、任务和公开包入口以 `deno.json` 为准。
- `src/db/` 定义与数据库结构对应的类型，`src/query/` 封装查询能力，`src/common/dbclient.ts` 提供共享连接池，`src/auth/`
  和 `src/oss/` 分别承载认证与对象存储逻辑。
- 顶层 `src/db.ts`、`src/query.ts`、`src/auth.ts`、`src/oss.ts` 和 `src/testlib.ts` 是公开入口。新增公开 API
  时，同步维护相应的 barrel export；新增包入口时同步维护 `deno.json` 的 `exports` 和 `imports`。

## TypeScript 约定

- 使用 Deno/ESM 风格导入，并保留本地模块的 `.ts` 扩展名。优先使用 `@/`、`@test/` 和 `@ijia/school-db/*`
  导入映射，避免脆弱的多层相对路径。
- 仅作为类型使用的符号通过 `import type` 导入。遵循现有命名和导出方式，不引入无必要的包装层或重复数据库抽象。
- 数据库模型必须准确反映 PostgreSQL 字段的类型和可空性。优先复用 `src/db/db_type.ts` 中的 `INT`、`SMALLINT`、`VARCHAR`
  等别名；可空列使用 `| null`，不要用可选属性代替数据库 `NULL`。
- 使用 `deno fmt` 的格式规则，行宽为 120。不要手工编辑依赖产物或生成文件。

## SQL 与迁移

- 初始化 SQL 位于 `sql/init/`。加载顺序是：递归加载 `function/`，按 `sql/init/sq.txt` 的顺序加载主体 SQL，再递归加载
  `query/`。
- 新增主体表、视图或初始化数据脚本时，将相对路径加入 `sql/init/sq.txt` 的正确依赖位置。`function/` 和 `query/` 下的
  `.sql` 文件会被递归发现，但仍需保证文件名排序满足依赖关系。
- 修改数据库结构时，同时更新初始化 SQL、对应的 `src/db/` 类型、受影响的查询代码和测试。面向已部署数据库的变更还应在
  `sql/update/` 添加迁移，不能只修改全新安装脚本。
- 保持 SQL 参数化；不要把外部输入拼接进 SQL 文本。数据库资源必须在成功和异常路径都正确释放。

## 构建与验证

- 修改 TypeScript 后运行 `deno task check-type`，并运行 `deno task check-fmt`；需要自动格式化时使用 `deno task fmt`。
- 测试使用 Vitest，通过 `deno task test` 运行。优先为改动运行相关的
  `test/tests/**/*.test.ts`，完成前再按影响范围扩大验证。
- 数据库测试要求 PostgreSQL 可用。连接由 `PG_URL` 提供，默认值为
  `pg://test@127.0.0.1:5432/postgres`；该角色必须有创建和删除数据库的权限。
- 测试 fixture 会为 worker 创建并清理临时数据库。新增测试时使用 `test/fixtures/db_connect.ts` 提供的
  fixture，并确保连接、事务和游标被释放；测试结束时存在未释放连接会直接失败。
- SQL 结构变更至少应增加或更新一个数据库集成测试，验证初始化后的实际 schema 或查询行为，而不只验证 TypeScript 类型。

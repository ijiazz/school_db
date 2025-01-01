测试框架使用 [vitest](https://cn.vitest.dev/)

测试需要连接数据库，在运行测试前需要先启动 PostgreSql 服务， 然后配置环境变量 PG_URL。或者，直接修改
`vitest.config.ts`。 用于测试的角色需要拥有创建数据库的权限 测试运行时会创建数据库，在测试结束后删除
见[./setup/setup_pgsql.ts](./setup/setup_pgsql.ts) 和 [./fixtures/db_connect.ts](./fixtures/db_connect.ts)

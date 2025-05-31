## 数据库初始化

`sql/create-merge.sh` 脚本文件标注了需要执行sql文件的顺序
进入 plpgsql. 按顺序导入sql 文件即可(记得把路径改为绝对路径)

例如：
`\i sql/init/tables_assets.sql` 创建自定义类型和表\
`\i sql/init/functions.sql` 定义了函数\
`\i sql/init/create_triggers.sql` 创建触发器
 
或者直接用 Deno 运行创建数据库的脚本文件 [scripts/create_db.ts](./scripts/create_db.ts)\
`deno run -A scripts/create_db.ts`

### 备份

备份与恢复整个数据库

```shell
pg_dump -f ./ijia_db.tar -F t -U postgres -d ijia # -f: 备份的文件路径。-F t为输出压缩包 -U 操作的用户。 -d 数据库名
pg_restore -d postgres -U postgres --create ./ijia_db.tar #-d: 要连接到的数据库名称。 -U 连接数据库的用户。 --create 创建新的数据库, 如果不存在，则恢复到连接的数据库  最后是备份文件路径
```

恢复时确保授权的角色已创建

备份数据库结构，用于比对生产环境和测试环境等是否一致

```shell
pg_dump -s -f ./ijia_db_schema.sql -h 127.0.0.1 -p 5432 -U postgres -d ijia # -f: 备份的文件路径。 -U 操作的用户。 最后的 ijia 为数据库名
```

## 在项目中使用库

可以使用 git submodules 引入项目。

如果是 deno， 配置 workspace 后可以直接导入。

如果是 node， 需要编译 ts。\
在你项目安装 npm 依赖`tslib` 和 `@rollup/plugin-typescript`。 然后运行
`pnpm dlx rollup -c school_db/build/rollup.config.mjs` 或 `npx rollup -c school_db/build/rollup.config.mjs`\
`-c` 选项指向 `school_db` 的 `rollup.config.mjs` 即可

或者，可以直接用 deno 进行编译, 直接在项目根目录下执行 `deno task build`

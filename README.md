## 数据库初始化

进入 plpgsql. 按顺序导入以下 sql 文件(记得把路径改为绝对路径)

`\i sql/init/create_tables.sql` 创建自定义类型和表
`\i sql/init/create_functions.sql` 定义了函数
`\i sql/init/create_triggers.sql` 创建触发器

其中 create_tables.sql 是必须的。其余是可选的

或者，直接在项目根目录下，执行命令 `psql postgres USERNAME -f sql/create_db.sql` , 这将创建数据库 ”ijia_test“ 并初始化数据库。

### 角色与权限

`\i sql/roles/roles.sql` 创建开发与生产环境中可能用到的角色
`\c ijia_test` 切换数据库
`\i sql/roles/grant.sql` 授权角色权限

`psql postgres USERNAME -f sql/roles/roles.sql` 数据库可以不用改
`psql ijia_test USERNAME -f sql/roles/grant.sql` 数据库必须改成创建的数据库

### 备份

备份表数据


```shell
 pg_dump -f ijia_db.tar -F t -U eaviyi ijia # -f: 备份的文件路径。 -U 操作的用户。 最后的 ijia 为数据库名
 pg_restore -d ijia -U eaviyi ijia_db.tar # -d: 要恢复到的数据库名称。 -U 操作的用户。 最后是备份文件路径
```

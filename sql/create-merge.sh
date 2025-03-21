#!/bin/sh
set -e

rooDir=`dirname $0`

 
targetFile=$1
# 创建表的 sql 文件顺序
cat "$rooDir/init/functions.sql" >> $targetFile
cat "$rooDir/init/tables_system.sql" >> $targetFile
cat "$rooDir/init/tables_assets.sql" >> $targetFile
cat "$rooDir/init/tables_user.sql" >> $targetFile
cat "$rooDir/init/extra/comment.sql" >> $targetFile

# 创建角色的 sql 文件
cat "$rooDir/roles/ijia_crawler.sql" >> $targetFile
cat "$rooDir/roles/ijia_web.sql" >> $targetFile
echo 输出到 ./init.sql 完成

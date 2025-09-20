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
cat "$rooDir/init/tables_post.sql" >> $targetFile
cat "$rooDir/init/tables_post_comment.sql" >> $targetFile

# 递归读取 functions 目录下的所有 sql 文件
find "$rooDir/functions" -name "*.sql" -type f | sort | while read sqlFile; do
    cat "$sqlFile" >> "$targetFile"
    echo -e "\n" >> "$targetFile"
done
#!/bin/sh
set -e

rooDir=`dirname $0`

targetFile=$1

# Function to recursively read sql files from a directory
merge_sql_files() {
    local sourceDir=$1
    if [ -d "$sourceDir" ]; then
        find "$sourceDir" -name "*.sql" -type f | sort | while read sqlFile; do
            echo "add: $sqlFile"
            printf "\n-- Merging file: $sqlFile \n" >> "$targetFile"
            cat "$sqlFile" >> "$targetFile"
        done
    else
        echo "Directory $sourceDir does not exist."
    fi
}

initDir="$rooDir/init"

# 清空目标文件
:> "$targetFile"

# Call the function for the functions directory
merge_sql_files "$initDir/function"


for file in \
  "$initDir/table/pla/tables_assets.sql" \
  "$initDir/table/pla/tables_comment.sql" \
  "$initDir/table/sys/tables_system.sql" \
  "$initDir/table/public/tables_user.sql" \
  "$initDir/table/public/tables_post.sql" \
  "$initDir/table/public/tables_post_comment.sql"
do
  if [ -f "$file" ]; then
    echo "add: $file"
    printf "\n-- Merging file: $file \n" >> "$targetFile"
    cat "$file" >> "$targetFile"
  else
    printf "Warning: file not found: %s\n" "$file"
  fi
done

merge_sql_files "$initDir/query"
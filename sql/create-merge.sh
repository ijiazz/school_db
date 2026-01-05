#!/bin/sh
set -e

rooDir=`dirname $0`
 

# Function to recursively read sql files from a directory
merge_sql_files() {
    local sourceDir=$1
    if [ -d "$sourceDir" ]; then
        find "$sourceDir" -name "*.sql" -type f | sort | while read sqlFile; do
            echo "add: $sqlFile"  >&2
            printf "\n-- Merging file: $sqlFile \n"
            cat "$sqlFile"
        done
    else
        echo "Directory $sourceDir does not exist."  >&2
    fi
}

initDir="$rooDir/init"


# Call the function for the functions directory
merge_sql_files "$initDir/function"


for file in \
  "$initDir/table/sys/init.sql" \
  "$initDir/table/sys/tables_system.sql" \
  "$initDir/table/sys/tables_file.sql" \
  "$initDir/table/pla/init.sql" \
  "$initDir/table/pla/tables_assets.sql" \
  "$initDir/table/pla/tables_comment.sql" \
  "$initDir/table/public/tables_user.sql" \
  "$initDir/table/public/tables_post.sql" \
  "$initDir/table/public/tables_post_comment.sql"
do
  if [ -f "$file" ]; then
    echo "add: $file" >&2
    printf "\n-- Merging file: $file \n"
    cat "$file"
  else
    printf "Warning: file not found: %s\n" "$file" >&2
  fi
done

merge_sql_files "$initDir/query"
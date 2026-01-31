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

filename="$initDir/sq.txt"
while read line
do
  
  # Trim whitespace
  line="$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  # Skip empty lines and comments
  case "$line" in
    ''|\#*) continue ;;
  esac

  file="$initDir/$line"
  if [ -f "$file" ]; then
    echo "add: $file" >&2
    printf "\n-- Merging file: $file \n"
    cat "$file"
  else
    printf "Warning: file not found: %s\n" "$file" >&2
  fi
done < $filename

merge_sql_files "$initDir/query"
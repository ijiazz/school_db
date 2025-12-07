import type { AssertJsType, ColumnMeta, SqlStatementDataset, TableType, YourTable } from "@asla/yoursql";
import { select, SqlTextStatementDataset } from "@asla/yoursql";
import { v } from "../common/sql.ts";
interface InsertForm {
  table: YourTable<any>;
  /** insertColumn -> formTableColumn  */
  keyMap: Record<string, string>;
  /** insertKey -> fromTableKey */
  on: Record<string, string>;
}

export function insetFrom<T extends TableType>(
  values: T[],
  valuesTypes: Record<string, ColumnMeta<any>>,
  from: InsertForm,
): { statement: SqlStatementDataset<T>; columns: string[] } {
  const insertKeys: readonly string[] = Object.keys(valuesTypes);
  const fTableName = from.table.name;

  const selectable = select(() => {
    const formTableColumns = Object.entries(from.keyMap).map(([k, v]) => fTableName + "." + v + " AS " + k);
    return insertKeys.map((key) => "t1." + key).join(",\n") + ",\n" + formTableColumns.join(",\n");
  })
    .from(v.createExplicitValues(values, initValuesTypes(insertKeys, valuesTypes)).toSelect("t1"))
    .innerJoin(from.table.name, {
      on: Object.entries(from.on).map(([insert, from]) => "t1." + insert + " = " + fTableName + "." + from),
    });

  // Selection.from 目前返回的 SqlStatementDataset 缺少 columns
  const keys = [...insertKeys, ...Object.keys(from.keyMap)];

  return {
    statement: new SqlTextStatementDataset(selectable.toString()),
    columns: keys,
  };
}
function initValuesTypes(keys: readonly string[], valuesTypes: Record<string, ColumnMeta<any>>) {
  let newTypes: Record<
    string,
    {
      sqlType: string;
      sqlDefault?: string;
      assertJsType?: AssertJsType;
    }
  > = {};
  let key: string;
  let columnMeta: ColumnMeta<any>;
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    columnMeta = valuesTypes[key];
    newTypes[key] = {
      assertJsType: columnMeta.sqlType === "JSONB" ? Object : undefined,
      sqlType: columnMeta.sqlType,
      sqlDefault: columnMeta.sqlDefault,
    };
  }
  return newTypes;
}

export enum UpdateBehaver {
  overIfOldIsNull = 1,
  overIfNewNotNull = 3,
  over = 2,
}
/**
 * ```ts
 * const result = createConflictUpdate(
 *   {
 *     k1: UpdateBehaver.overIfOldIsNull,
 *     k2: UpdateBehaver.overIfNewNotNull,
 *     k3: UpdateBehaver.over,
 *     k4: "now()",
 *   },
 *   "user"
 * );
 * console.log(result);
 * `k1=CASE WHEN user.k1 IS NULL THEN EXCLUDED.k1 ELSE user.k1 END,
 * k2=COALESCE(EXCLUDED.k2, user.k2),
 * k3=EXCLUDED.k3,
 * k4=now()
 * `
 * ```
 */
export function createConflictUpdate<T extends string>(
  beaver: { [key in T]: UpdateBehaver | string },
  table: string,
): string;
export function createConflictUpdate(beaver: Record<string, UpdateBehaver | string>, table: string): string {
  const keys = Object.keys(beaver);
  if (keys.length === 0) return "";
  let key: string = keys[0];
  let str: string = key + "=" + getUpdateStr(key, beaver[key], table);

  for (let i = 1; i < keys.length; i++) {
    key = keys[i];
    str += ",\n" + key + "=" + getUpdateStr(key, beaver[key] as UpdateBehaver, table);
  }
  return "SET " + str;
}
function getUpdateStr(key: string, value: UpdateBehaver | string, table: string) {
  switch (value) {
    case UpdateBehaver.over:
      return "EXCLUDED." + key;
    case UpdateBehaver.overIfOldIsNull:
      return `CASE WHEN ${table}.${key} IS NULL THEN EXCLUDED.${key} ELSE ${table}.${key} END`;
    case UpdateBehaver.overIfNewNotNull:
      return `COALESCE(EXCLUDED.${key}, ${table}.${key})`;
    default:
      return value;
  }
}

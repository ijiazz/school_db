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

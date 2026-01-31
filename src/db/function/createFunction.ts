import type { SqlValuesCreator } from "@asla/yoursql";
import type { DbQueryPool, ExecutableSQL } from "@asla/yoursql/client";
import type { DbFunctions } from "./function.ts";

export function createDbFunction<T extends object = DbFunctions>(
  pool: DbQueryPool,
  v: SqlValuesCreator,
): GenFunctionType<T> {
  const target = new Proxy(v, {
    get(target, p, receiver) {
      if (typeof p !== "string") {
        throw new Error("Invalid property type");
      }

      return (...args: unknown[]) => {
        const sql = `SELECT ${p}(${v.toValues(args)}) AS res`;
        return pool.createQueryableSQL(sql, (queryable, sql) => {
          return queryable.queryFirstRow<{ res: unknown }>(sql).then((row) => row.res);
        });
      };
    },
  });
  return target as any;
}

type GenFunctionType<F extends object> = {
  [K in keyof F]: F[K] extends (...args: any[]) => any ? (...args: Parameters<F[K]>) => ExecutableSQL<ReturnType<F[K]>>
    : never;
};

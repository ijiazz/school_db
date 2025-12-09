import { insertInto, ObjectToValueKeys, pgSqlTransformer, SqlValuesCreator } from "@asla/yoursql";

export const v = SqlValuesCreator.create(pgSqlTransformer);
export function insertIntoValues(
  table: string,
  values: object | object[],
  columnsTypes?: ObjectToValueKeys<object | object[]>,
) {
  const { columns, text } = v.createExplicitValues(values, columnsTypes);
  return insertInto(table, columns).values(text);
}

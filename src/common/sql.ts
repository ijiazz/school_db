import v from "../yoursql.ts";
import type { DatabaseError } from "pg";
export const operation = {
  andEq(value: Record<string, any>): string[] {
    let values: string[] = [];
    const keys = Object.keys(value);
    let val: any;
    for (let i = 0; i < keys.length; i++) {
      val = value[keys[i]];
      if (val === undefined) continue;
      if (val === null) values.push(keys[i] + " IS NULL");
      else values.push(keys[i] + "=" + v(val));
    }
    return values;
  },
};
export function genErrPosition(text: string, index: number) {
  const from = index > 100 ? index - 100 : 0;
  return text.slice(from, index);
}
export function findTextPositionLine(text: string, index: number) {
  const matchLine = /[\n\r]+/;
  let line = 1;
  let position = 0;
  let offset = 0;
  while (text) {
    let n = text.match(matchLine);
    if (typeof n?.index !== "number") {
      position = text.length;
      break;
    }
    const next = n.index + n[0].length;
    if (offset + next > index) {
      return [line, index - offset];
    }
    if (offset + next === index) {
      return [line + 1, 0];
    }
    offset += next;
    text = text.slice(next);
    line++;
  }
  return [line, position];
}

export function genPgSqlErrorMsg(
  error: DatabaseError,
  option: {
    sqlText?: string;
    sqlFileName?: string;
  } = {},
) {
  const { sqlFileName = "text", sqlText } = option;
  let detail = "";
  if (error.code) detail += ` (code ${error.code})`;
  if (error.position && sqlText) {
    const offset = parseInt(error.position);
    const [line, position] = findTextPositionLine(sqlText, offset);
    detail += ` ${sqlFileName}:${line}:${position}`;
    detail += "\n" + genErrPosition(sqlText, offset);
  }
  return detail;
}

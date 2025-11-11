import { DatabaseError } from "../../common/pg.ts";
import { genErrPosition } from "../../common/sql.ts";

export function addPgErrorInfo(e: any, text: string): never {
  if (e instanceof DatabaseError && e.position) {
    if (e.position) {
      const index = parseInt(e.position);
      const target = genErrPosition(text, index);
      Reflect.set(e, "targetText", target);
      Reflect.set(e, "targetTextNext", text.slice(index, index + 50));
    }
  }
  throw e;
}

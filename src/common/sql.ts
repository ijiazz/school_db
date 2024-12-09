import { v } from "../db.ts";

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

import { sqlValue } from "../db.ts";

export const operation = {
  andEq(value: Record<string, any>): string[] {
    let values: string[] = [];
    const keys = Object.keys(value);
    let v: any;
    for (let i = 0; i < keys.length; i++) {
      v = value[keys[i]];
      if (v === undefined) continue;
      if (v === null) values.push(keys[i] + " IS NULL");
      else values.push(keys[i] + "=" + sqlValue(v));
    }
    return values;
  },
};

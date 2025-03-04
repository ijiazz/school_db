import { DbConnection, DbPoolConnection, DbQuery } from "@ijia/data/yoursql";
import { vi } from "vitest";

export class MockDbConnection extends DbQuery implements DbConnection {
  closed = false;
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    return;
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
  query = vi.fn();
  multipleQuery = vi.fn(async function () {
    return [{ rowCount: 0, rows: [] }, { rowCount: 0, rows: [] }];
  });
}
export class MockDbPoolConnection extends DbQuery implements DbPoolConnection {
  release = vi.fn(() => {
    this.released = true;
  });
  [Symbol.dispose]() {
    this.release();
  }
  query = vi.fn(async function () {
    return { rowCount: 0, rows: [] };
  });
  multipleQuery = vi.fn(async function () {
    return [{ rowCount: 0, rows: [] }, { rowCount: 0, rows: [] }];
  });
  released = false;
}

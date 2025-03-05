import { ResourceManage, ResourcePool } from "@/common/pool.ts";
import { test as viTest, vi } from "vitest";
export class MockConn {
  idle = true;
  connected = true;
}
export class MockResourceManage implements ResourceManage<MockConn> {
  connErrored!: (conn: MockConn) => void;
  init({ connErrored }: { connErrored(conn: MockConn, err?: any): void }) {
    this.connErrored = connErrored;
  }
  connect = vi.fn<() => Promise<MockConn>>(async function () {
    return new MockConn();
  });
  disconnect = vi.fn<(conn: MockConn) => void>(function (conn) {
    if (conn.connected === false) throw new Error("connected 已经是 false");
    conn.connected = false;
  });
  markIdle = vi.fn<(conn: MockConn) => void>(function (conn) {
    if (conn.idle === false) throw new Error("idle 已经是 true");
    conn.idle = true;
  });
  markUsed = vi.fn<(conn: MockConn) => void>(function (conn) {
    if (conn.idle === false) throw new Error("idle 已经是 false");
    conn.idle = false;
  });
}
export interface Context {
  resourceManage: MockResourceManage;
  pool: ResourcePool<MockConn>;
}
export const test = viTest.extend<Context>({
  async resourceManage({}, use) {
    return use(new MockResourceManage());
  },
  async pool({ resourceManage }, use) {
    use(new ResourcePool(resourceManage));
  },
});

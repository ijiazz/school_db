export interface ResourceManage<T> {
  init(ctrl: { connErrored(conn: T, err?: any): void }): void;
  connect(): Promise<T>;
  disconnect(conn: T): void;
  markIdle(conn: T): void;
  markUsed(conn: T): void;
}
export enum ConnectionStatus {
  closed,
  connected,
  connecting,
}
export class ResourcePool<T> {
  #pool = new Map<T | Promise<T>, { isFree: boolean }>();
  #free: { conn: T; date: number }[] = [];
  constructor(
    private handler: ResourceManage<T>,
    option: PoolOption = {},
  ) {
    handler.init({
      connErrored: (conn, err) => {
        this.#pool.delete(conn);
      },
    });
    this.maxCount = option.maxCount ?? 3;
  }

  #queue: { resolve(conn: T): void; reject(e: any): void }[] = [];
  connect(): Promise<T> {
    if (this.#closedError) return Promise.reject(this.#closedError);
    if (this.#free.length) {
      const conn = this.#free.pop()!.conn;
      this.handler.markUsed(conn);
      return Promise.resolve(conn);
    }
    if (this.totalCount >= this.maxCount) {
      return new Promise((resolve, reject) => {
        this.#queue.push({ resolve, reject });
      });
    }

    const promise = this.handler.connect();
    const info = { isFree: false };
    this.#pool.set(promise, info);
    return promise
      .then((conn) => {
        if (this.#closedError) throw this.#closedError;
        this.#pool.set(conn, info);
        return conn;
      })
      .finally(() => {
        this.#pool.delete(promise);
      });
  }
  release(conn: T) {
    const info = this.#pool.get(conn);
    if (!info) throw new Error("这个连接不属于这个池");
    if (this.#closedError) {
      this.handler.disconnect(conn);
      this.#pool.delete(conn);
      if (this.#pool.size === 0) this.#closeResolver?.();
      return;
    }

    if (info.isFree) return;
    if (this.#queue.length) {
      const request = this.#queue.shift()!;
      request.resolve(conn);
    } else {
      info.isFree = true;
      this.#free.push({ conn, date: Date.now() });
      this.handler.markIdle(conn);
    }
  }
  #closeResolver?: () => void;
  #closedError?: Error;
  close(force: boolean = false, err = new Error("Pool is closed")): Promise<void> {
    if (this.#closedError) return Promise.resolve();
    this.#closedError = err;
    for (const item of this.#queue) {
      item.reject(err);
    }
    for (const item of this.#free) {
      this.handler.disconnect(item.conn);
      this.#pool.delete(item.conn);
    }
    this.#free.length = 0;

    if (force) {
      for (const conn of this.#pool.keys()) {
        if (!(conn instanceof Promise)) {
          this.handler.disconnect(conn);
        }
      }
      this.#pool.clear();
      return Promise.resolve();
    } else {
      return new Promise<void>((resolve, reject) => {
        this.#closeResolver = resolve;
      });
    }
  }
  /** 池是否已关闭 */
  get closed() {
    return this.#closedError;
  }
  /** 保留的总数 */
  get totalCount() {
    return this.#pool.size;
  }
  /** 空闲数量 */
  get idleCount() {
    return this.#free.length;
  }
  /** 等待获取的数量 */
  get waitingCount() {
    return this.#queue.length;
  }
  /** 最大数量 */
  maxCount: number;

  checkTimeout(idleTimeout: number) {
    const now = Date.now();
    let i = 0;
    for (; i < this.#free.length; i++) {
      const info = this.#free[i];
      if (now - info.date > idleTimeout) {
        this.handler.disconnect(info.conn);
        this.#pool.delete(info.conn);
      } else break;
    }
    if (i) this.#free = this.#free.slice(i);
  }
}
export type PoolOption = {
  /** 连接池保持的最大连接数量。 默认 3 */
  maxCount?: number;
};

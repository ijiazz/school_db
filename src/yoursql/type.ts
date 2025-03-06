import type { DbQueryPool } from "@asla/yoursql/client";

/**
 * 数据库连接池
 * @public
 */
export interface DbPool extends DbQueryPool, AsyncDisposable {
  /** 关闭所有链接。如果 force 为 true, 则直接断开所有连接，否则等待连接释放后再关闭 */
  close(force?: boolean): Promise<void>;
}

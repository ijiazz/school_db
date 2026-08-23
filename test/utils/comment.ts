import { dbPool } from "@/common/dbclient.ts";
import { v } from "@/common/sql.ts";
import { newTestUser } from "@/testlib/create_user.ts";
import type { DbComment } from "@ijia/school-db/db";

type CommentRow = Pick<DbComment, "id" | "reply_count" | "is_root_reply_count"> & { is_delete: boolean };

export async function prepareComments() {
  const owner = await newTestUser("owner");
  const { id: treeId } = await dbPool.queryFirstRow<{ id: number }>(
    `INSERT INTO comment_tree (group_type, owner_id) VALUES ('post', ${v(owner.id)}) RETURNING id`,
  );

  return {
    treeId,
    ownerId: owner.id,
  };
}

export async function getCommentRow(commentId: number): Promise<CommentRow | null> {
  const rows = await dbPool.queryRows<CommentRow>(
    `SELECT id, reply_count, is_root_reply_count, is_delete FROM comment WHERE id = ${v(commentId)}`,
  );
  return rows[0] ?? null;
}

export async function getCommentTotal(treeId: number) {
  const { comment_total } = await dbPool.queryFirstRow<{ comment_total: number }>(
    `SELECT comment_total FROM comment_tree WHERE id = ${v(treeId)}`,
  );
  return comment_total;
}

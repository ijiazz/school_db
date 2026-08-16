import { dbPool } from "@/common/dbclient.ts";
import type { DbComment, DbCommentTree } from "@ijia/school-db/db";
import { insertIntoValues, v } from "@/common/sql.ts";

export type CreateCommentOption = { userId: number; comment_tree_id: number; text: string; replyCommentId?: number };

export async function createComment(
  option: CreateCommentOption,
): Promise<{ id: number; error?: undefined } | { error: string; id?: undefined }> {
  const { userId, comment_tree_id, text, replyCommentId } = option;

  const [commentTree] = await dbPool.queryRows<Pick<DbCommentTree, "owner_id" | "is_closed">>(
    v.gen`SELECT owner_id, is_closed FROM comment_tree WHERE id=${v(comment_tree_id)} LIMIT 1`,
  );
  if (!commentTree || (commentTree.is_closed && commentTree.owner_id !== userId)) {
    // 如果已关闭评论区(is_closed=true)，只有帖子作者能创建评论
    return { error: `comment tree "${comment_tree_id}" 不存在` };
  }

  await using t = dbPool.begin();
  let rootCommentId: number | undefined;
  if (replyCommentId !== undefined) {
    const [parent] = await t.queryRows<Pick<DbComment, "id" | "root_comment_id">>(
      v.gen`SELECT id, root_comment_id FROM comment
        WHERE id=${v(replyCommentId)} AND comment_tree_id=${v(comment_tree_id)} AND NOT is_delete
        LIMIT 1`,
    );
    if (!parent) return { error: `parent comment "${replyCommentId}" 不存在` };
    rootCommentId = parent.root_comment_id ?? parent.id;
  }

  const insert = insertIntoValues("comment", {
    content_text: text,
    comment_tree_id,
    user_id: userId,
    parent_comment_id: replyCommentId,
    root_comment_id: rootCommentId,
  }).returning("id");
  const { id } = await t.queryFirstRow<{ id: number }>(insert);
  await t.execute(v.gen`
    UPDATE comment_tree SET comment_total = comment_total + 1 WHERE id = ${comment_tree_id}`);

  if (replyCommentId !== undefined) {
    await t.execute(v.gen`
      UPDATE comment SET reply_count = reply_count + 1 WHERE id = ${replyCommentId}`);
    await t.execute(v.gen`
      UPDATE comment SET is_root_reply_count = is_root_reply_count + 1 WHERE id = ${rootCommentId}`);
  }

  await t.commit();
  return { id };
}

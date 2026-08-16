import { test } from "@test/fixtures/db_connect.ts";
import { getCommentRow, getCommentTotal, prepareComments } from "@test/utils/comment.ts";
import { newTestUser } from "@/testlib/create_user.ts";
import { expect } from "vitest";
import { createComment } from "@ijia/school-db/query";

test("创建根评论，作品评论计数应该加1", async function ({ publicDbPool }) {
  const context = await prepareComments();
  const author = await newTestUser("author");

  const comment = await createComment({
    userId: author.id,
    comment_tree_id: context.treeId,
    text: "root",
  });

  expect(comment.error).toBeUndefined();
  await expect(getCommentTotal(context.treeId)).resolves.toBe(1);
  await expect(
    publicDbPool.queryFirstRow(
      `SELECT user_id, content_text, root_comment_id, parent_comment_id FROM comment WHERE id = ${comment.id!}`,
    ),
  ).resolves.toMatchObject({
    user_id: author.id,
    content_text: "root",
    root_comment_id: null,
    parent_comment_id: null,
  });
});

test(
  "回复根评论，根评论的 reply_count 和 is_root_reply_count 应该加1，且总评论数也应该加1",
  async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment({ userId: author.id, comment_tree_id: context.treeId, text: "root" });
    const rootId = root.id!;
    const reply = await createComment({
      userId: author.id,
      comment_tree_id: context.treeId,
      text: "reply",
      replyCommentId: rootId,
    });

    expect(reply).not.toBeNull();
    await expect(getCommentTotal(context.treeId)).resolves.toBe(2);
    await expect(getCommentRow(rootId)).resolves.toMatchObject({ reply_count: 1, is_root_reply_count: 1 });
    await expect(
      publicDbPool.queryFirstRow(`SELECT root_comment_id, parent_comment_id FROM comment WHERE id = ${reply.id!}`),
    ).resolves.toMatchObject({ root_comment_id: rootId, parent_comment_id: rootId });
  },
);
test(
  "回复二级评论，父评论的 reply_count 和根评论的 is_root_reply_count 应该加1，且总评论数也应该加1",
  async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment({ userId: author.id, comment_tree_id: context.treeId, text: "root" });
    const rootId = root.id!;
    const reply = await createComment({
      userId: author.id,
      comment_tree_id: context.treeId,
      text: "reply",
      replyCommentId: rootId,
    });
    const replyId = reply.id!;

    const child = await createComment({
      userId: author.id,
      comment_tree_id: context.treeId,
      text: "child",
      replyCommentId: replyId,
    });

    expect(child).not.toBeNull();
    await expect(getCommentTotal(context.treeId)).resolves.toBe(3);
    await expect(getCommentRow(rootId)).resolves.toMatchObject({ reply_count: 1, is_root_reply_count: 2 });
    await expect(getCommentRow(reply.id!)).resolves.toMatchObject({ reply_count: 1 });
    await expect(
      publicDbPool.queryFirstRow(`SELECT root_comment_id, parent_comment_id FROM comment WHERE id = ${child.id!}`),
    ).resolves.toMatchObject({ root_comment_id: rootId, parent_comment_id: replyId });
  },
);

test("评论关闭后，只有 owner 能评论", async function ({ publicDbPool }) {
  const context = await prepareComments();
  const author = await newTestUser("author");
  await publicDbPool.execute(`UPDATE comment_tree SET is_closed = TRUE WHERE id = ${context.treeId}`);

  {
    const { error } = await createComment({ userId: author.id, comment_tree_id: context.treeId, text: "forbidden" });
    expect(error).toBeTypeOf("string");
  }
  await expect(getCommentTotal(context.treeId)).resolves.toBe(0);

  {
    const { error } = await createComment({ userId: context.ownerId, comment_tree_id: context.treeId, text: "owner" });
    expect(error).toBeUndefined();
  }
  await expect(getCommentTotal(context.treeId)).resolves.toBe(1);
});

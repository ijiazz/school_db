import { dbPool } from "@/common/dbclient.ts";
import { v } from "@/common/sql.ts";
import { newTestUser } from "@/testlib/create_user.ts";
import { test } from "@test/fixtures/db_connect.ts";
import { getCommentRow, getCommentTotal, prepareComments } from "@test/utils/comment.ts";
import { expect } from "vitest";
import { createComment as createQueryComment, createDbFunction } from "@ijia/school-db/query";

const { describe } = test;

const f = createDbFunction(dbPool, v);

async function createComment(treeId: number, userId: number, text: string, replyCommentId?: number) {
  const comment = await createQueryComment({ userId, comment_tree_id: treeId, text, replyCommentId });
  if (!comment.id) throw new Error("Failed to create test comment");
  return comment;
}

describe("comment_delete_mark", function () {
  test("删除叶子评论，总评论数、父评论回复数和根评论总回复数应减 1", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);

    await expect(getCommentTotal(context.treeId)).resolves.toBe(2);
    await expect(f.comment_delete_mark(reply.id)).resolves.toBe(1);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(1);
    await expect(getCommentRow(root.id)).resolves.toMatchObject({ reply_count: 0, is_root_reply_count: 0 });
    await expect(getCommentRow(reply.id)).resolves.toMatchObject({ is_delete: true });
  });

  test("删除一级评论只标记该评论，不删除其子评论", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    const child = await createComment(context.treeId, author.id, "child", reply.id);

    await expect(f.comment_delete_mark(reply.id)).resolves.toBe(1);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(2);
    await expect(getCommentRow(root.id)).resolves.toMatchObject({ reply_count: 0, is_root_reply_count: 1 });
    await expect(getCommentRow(child.id)).resolves.toMatchObject({ is_delete: false });
  });

  test("删除二级评论，直接父评论和根评论计数相应减少", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    const child = await createComment(context.treeId, author.id, "child", reply.id);

    await expect(f.comment_delete_mark(child.id)).resolves.toBe(1);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(2);
    await expect(getCommentRow(reply.id)).resolves.toMatchObject({ reply_count: 0 });
    await expect(getCommentRow(root.id)).resolves.toMatchObject({ reply_count: 1, is_root_reply_count: 1 });
  });

  test("重复删除已标记的评论返回 0，且不会重复扣减计数", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);

    await expect(f.comment_delete_mark(reply.id)).resolves.toBe(1);
    await expect(f.comment_delete_mark(reply.id)).resolves.toBe(0);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(1);
    await expect(getCommentRow(root.id)).resolves.toMatchObject({ reply_count: 0, is_root_reply_count: 0 });
  });
});

describe("comment_recursive_delete", function () {
  test("删除根评论时级联删除所有子评论", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    const child = await createComment(context.treeId, author.id, "child", reply.id);

    await expect(f.comment_recursive_delete(root.id)).resolves.toBe(3);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(0);
    await expect(getCommentRow(root.id)).resolves.toBeNull();
    await expect(getCommentRow(reply.id)).resolves.toBeNull();
    await expect(getCommentRow(child.id)).resolves.toBeNull();
  });

  test("删除一级评论时级联删除其后代并更新根评论计数", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const sibling = await createComment(context.treeId, author.id, "sibling", root.id);
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    const child = await createComment(context.treeId, author.id, "child", reply.id);
    const grandchild = await createComment(context.treeId, author.id, "grandchild", child.id);

    await expect(f.comment_recursive_delete(reply.id)).resolves.toBe(3);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(2);
    await expect(getCommentRow(root.id)).resolves.toMatchObject({ reply_count: 1, is_root_reply_count: 1 });
    await expect(getCommentRow(sibling.id)).resolves.toMatchObject({ is_delete: false });
    await expect(getCommentRow(reply.id)).resolves.toBeNull();
    await expect(getCommentRow(child.id)).resolves.toBeNull();
    await expect(getCommentRow(grandchild.id)).resolves.toBeNull();
  });

  test("删除二级评论时更新直接父评论和根评论计数", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    const child = await createComment(context.treeId, author.id, "child", reply.id);
    await createComment(context.treeId, author.id, "grandchild", child.id);

    await expect(f.comment_recursive_delete(child.id)).resolves.toBe(2);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(2);
    await expect(getCommentRow(reply.id)).resolves.toMatchObject({ reply_count: 0 });
    await expect(getCommentRow(root.id)).resolves.toMatchObject({ reply_count: 1, is_root_reply_count: 1 });
  });

  test("删除不存在或已软删除的评论返回 0", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    await f.comment_delete_mark(reply.id);

    await expect(f.comment_recursive_delete(reply.id)).resolves.toBe(0);
    await expect(f.comment_recursive_delete(0)).resolves.toBe(0);
    await expect(getCommentTotal(context.treeId)).resolves.toBe(1);
  });
});

describe("comment_delete", function () {
  test("非 owner 删除别人的评论返回 0", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const other = await newTestUser("other");
    const root = await createComment(context.treeId, author.id, "root");

    await expect(f.comment_delete(root.id, other.id)).resolves.toBe(0);
    await expect(getCommentRow(root.id)).resolves.not.toBeNull();
    await expect(getCommentTotal(context.treeId)).resolves.toBe(1);
  });

  test("评论作者可以删除自己的评论", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");

    await expect(f.comment_delete(root.id, author.id)).resolves.toBe(1);
    await expect(getCommentRow(root.id)).resolves.toBeNull();
  });

  test("owner 可以删除别人的评论", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");

    await expect(f.comment_delete(root.id, context.ownerId)).resolves.toBe(1);
    await expect(getCommentRow(root.id)).resolves.toBeNull();
  });

  test("不传入 user_id 时绕过权限检查", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");

    await expect(f.comment_delete(root.id, null)).resolves.toBe(1);
    await expect(getCommentRow(root.id)).resolves.toBeNull();
  });

  test("删除根评论时递归删除子评论", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);

    await expect(f.comment_delete(root.id, author.id)).resolves.toBe(2);
    await expect(getCommentRow(root.id)).resolves.toBeNull();
    await expect(getCommentRow(reply.id)).resolves.toBeNull();
  });

  test("删除非根评论时只软删除目标评论", async function ({ publicDbPool }) {
    const context = await prepareComments();
    const author = await newTestUser("author");
    const root = await createComment(context.treeId, author.id, "root");
    const reply = await createComment(context.treeId, author.id, "reply", root.id);
    const child = await createComment(context.treeId, author.id, "child", reply.id);

    await expect(f.comment_delete(reply.id, author.id)).resolves.toBe(1);
    await expect(getCommentRow(reply.id)).resolves.toMatchObject({ is_delete: true });
    await expect(getCommentRow(child.id)).resolves.toMatchObject({ is_delete: false });
  });
});

import { operation } from "../common/sql.ts";
import { DbQuery, pla_comment, pla_asset, pla_user, sqlValue, user_avatar, DbUserAvatarCreate } from "../db.ts";
import type {
  CommentReplyItemDto,
  CommentRootItemDto,
  GetCommentListParam,
  GetCommentReplyListParam,
  GetAssetListParam,
  GetUserParam,
  AssetItemDto,
  UserItemDto,
} from "./query.dto.ts";

export const DEFAULT_RESOURCE = {
  cover: "",
};
function uriToUrl(uri: string, origin: string) {
  return origin + "/file/" + uri;
}

export function renameAvatarUriSql(oldId: string, newImage: DbUserAvatarCreate) {
  const newId = newImage.id;
  if (oldId === newId) throw new Error("oldUri 不能和 newId 一致");
  let sql = user_avatar.insert([newImage], { conflict: ["id"] });
  sql += ";\n" + pla_user.update({ avatar: newId }, { where: "avatar=" + sqlValue(oldId) });
  sql +=
    ";\n" + pla_asset.update({ user_avatar_snapshot: newId }, { where: "user_avatar_snapshot=" + sqlValue(oldId) });
  sql +=
    ";\n" + pla_comment.update({ user_avatar_snapshot: newId }, { where: "user_avatar_snapshot=" + sqlValue(oldId) });
  return sql;
}

export async function getUserList(queryable: DbQuery, option: GetUserParam & DebugOption = {}): Promise<UserItemDto[]> {
  const { page = 0, pageSize = 20, platform, user_id, s_user_name } = option;

  const sql = pla_user
    .fromAs("p")
    .select<UserItemDto>({
      avatarUrl: "p.avatar",
      ip_location: true,
      user_name: true,
      user_id: "p.pla_uid",
    })
    .where(() => {
      const searchWhere = [];
      if (s_user_name) searchWhere.push(createSearch("user_name", s_user_name));
      return operation.andEq({ platform, pla_uid: user_id }).concat(searchWhere);
    })
    .limit(pageSize, page * pageSize);
  option.catchSql?.(sql.toString());
  return queryable.queryRows(sql);
}

function sqlAssetList(option: GetAssetListParam = {}) {
  const { page = 0, pageSize = 20, platform, userId, sort } = option;
  //TODO 处理资源信息
  const selectable = pla_asset
    .fromAs("p")
    .innerJoin(pla_user, "u", "u.pla_uid=p.pla_uid")
    .select({
      published_id: true,
      publish_time: true,
      type: "content_type",
      ip_location: true,
      content_text: true,
      stat: `jsonb_build_object('collection_num', p.collection_num , 'forward_total', p.forward_num, 'digg_total', p.like_count)`,
      author: `jsonb_build_object('user_name', u.user_name, 'user_id', u.pla_uid)`,
    })
    .where(() => {
      const searchWhere: string[] = [];
      if (option.s_author) searchWhere.push(createSearch("u.user_name", option.s_author));
      if (option.s_content) searchWhere.push(createSearch("p.content_text", option.s_content));
      operation
        .andEq({
          ["p.published_id"]: userId,
          ["p.platform"]: platform,
        })
        .concat(searchWhere);
      return searchWhere;
    })
    .orderBy(() => {
      let by: string[] = [];
      if (sort) {
        const map: Record<string, string> = {
          publish_time: "p.published_time",
          digg_total: "p.like_count",
          forward_total: "p.forward_num",
          collection_num: "p.collection_num",
        };
        for (const [k, v] of Object.entries(sort)) {
          if (!map[k]) continue;
          by.push(map[k] + " " + v);
        }
      }
      return by;
    })
    .limit(pageSize, page * pageSize);
  return selectable;
}

interface DebugOption {
  catchSql?(sql: string): void;
}
export async function getAssetList(
  queryable: DbQuery,
  option: GetAssetListParam & { published_id?: string } & DebugOption = {}
): Promise<AssetItemDto[]> {
  const sql1 = sqlAssetList(option);

  const sql = `WITH t AS ${sql1.toSelect()}
SELECT t.*, jsonb_set(t.stat, ARRAY['comment_total'], (CASE WHEN c.count IS NULL THEN 0 ELSE c.count END)::TEXT::JSONB) AS stat FROM t 
LEFT JOIN (
    SELECT c.published_id, count(*)::INT FROM t INNER JOIN pla_comment AS c ON c.published_id = t.published_id
    GROUP BY c.published_id
) AS c ON t.published_id =c.published_id`;

  option.catchSql?.(sql.toString());
  const rows = await queryable.queryRows(sql);

  const uriToUrl = (uri: string) => "/file/" + uri;
  return rows.map((item): AssetItemDto => {
    return {
      audioUrlList: item.audio_uri?.map(uriToUrl),
      imageUrlList: item.image_uri?.map(uriToUrl),
      videoUrlList: item.video_uri?.map(uriToUrl),
      author: item.author,
      content_text: item.content_text ?? "",
      ip_location: item.ip_location ?? "未知",
      stat: item.stat,
      publish_time: item.publish_time,
      type: item.type,
      published_id: item.published_id,
      cover: {
        origin: { url: item.cover_uri ? uriToUrl(item.cover_uri) : DEFAULT_RESOURCE.cover },
      },
    };
  });
}

function sqlCommentList(option: (GetCommentListParam & GetCommentReplyListParam) & DebugOption = {}) {
  const { page = 0, pageSize = 20, root_comment_id = null, sort } = option;

  const selectable = pla_comment
    .fromAs("c")
    .innerJoin(pla_user, "u", "u.pla_uid=c.pla_uid")
    .select({
      comment_id: "c.comment_id",
      content_text: "c.content_text",
      comment_type: "c.comment_type",
      publish_time: "c.publish_time",
      like_count: "c.like_count",
      author_like: "c.author_like",
      image_uri: "c.image_uri",
      user: `jsonb_build_object('user_name', u.user_name, 'user_id', u.pla_uid)`,
    })
    .where(() => {
      const where: string[] = operation.andEq({
        published_id: option.asset_id,
        root_comment_id: root_comment_id,
      });
      if (option.s_content) where.push(createSearch("c.content_text", option.s_content));
      if (option.s_user) where.push(createSearch("u.user_name", option.s_user));
      return where;
    })
    .orderBy(() => {
      let by: string[] = [];
      if (sort) {
        const map: Record<string, string> = {
          author_like: "c.author_like",
          publish_time: "c.published_time",
          like_count: "c.like_count",
        };
        for (const [k, v] of Object.entries(sort)) {
          if (!map[k]) continue;
          by.push(map[k] + " " + v);
        }
      }
      return by;
    })
    .limit(pageSize, page * pageSize);

  return selectable;
}
export async function getCommentList(
  queryable: DbQuery,
  option: GetCommentListParam & DebugOption = {}
): Promise<CommentRootItemDto[]> {
  const sql0 = sqlCommentList(option);

  const sql = `WITH t AS ${sql0.toSelect()}
SELECT  c_t.count AS reply_total, t.* FROM t 
LEFT JOIN (
SELECT c.root_comment_id,count(*)::INT FROM t inner JOIN pla_comment AS c ON c.root_comment_id=t.comment_id 
GROUP BY c.root_comment_id) AS c_t
ON t.comment_id=c_t.root_comment_id ;`;

  option.catchSql?.(sql.toString());
  const rows = await queryable.queryRows<CommentReplyItemDto>(sql);

  return rows.map((item): CommentReplyItemDto => {
    item.imageUrlList = Reflect.get(item, "image_uri")?.map(uriToUrl);
    Reflect.deleteProperty(item, "image_uri");
    return item;
  });
}
export async function getCommentReplyByCid(
  queryable: DbQuery,
  option: GetCommentReplyListParam & DebugOption = {}
): Promise<CommentReplyItemDto[]> {
  const sql = sqlCommentList(option);

  option.catchSql?.(sql.toString());
  const rows = await queryable.queryRows<CommentReplyItemDto>(sql);

  return rows.map((item): CommentReplyItemDto => {
    item.imageUrlList = Reflect.get(item, "image_uri")?.map(uriToUrl);
    Reflect.deleteProperty(item, "image_uri");
    return item;
  });
}
function createSearch(column: string, value: string) {
  return `${column} LIKE ${sqlValue("%" + value + "%")}`;
}

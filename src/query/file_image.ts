import { file_image, pla_comment, pla_user, pla_published, sqlValue, DbFileImageCreate } from "../db.ts";

export function renameAvatarUriSql(oldUri: string, newImage: DbFileImageCreate) {
  const newUri = newImage.uri;
  if (oldUri === newUri) throw new Error("oldUri 不能和 new Uri 一致");
  let sql = file_image.insert([newImage], { conflict: ["uri"] });
  sql += ";\n" + pla_user.update({ avatar: newUri }, { where: "avatar=" + sqlValue(oldUri) });
  sql +=
    ";\n" +
    pla_published.update({ user_avatar_snapshot: newUri }, { where: "user_avatar_snapshot=" + sqlValue(oldUri) });
  sql +=
    ";\n" + pla_comment.update({ user_avatar_snapshot: newUri }, { where: "user_avatar_snapshot=" + sqlValue(oldUri) });
  return sql;
}

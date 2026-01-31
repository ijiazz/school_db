import { createUser, CreateUserOption } from "@ijia/data/query";

let id = 0;
export async function createTempTestUser(userInfo: CreateUserOption = {}) {
  const email = `temp_user_${id++}`;
  const { user_id } = await createUser(email, userInfo);
  return { user_id, email };
}

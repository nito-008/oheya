import { Hono } from "hono";
import { getRandomPublicId } from "./service";
import { userNotFound, type UsersEnv } from ".";

export const randomUserRouter = new Hono<UsersEnv>().get("/", async (c) => {
  const publicId = await getRandomPublicId(c.env);
  if (!publicId) {
    return c.json(userNotFound, 404);
  }

  return c.json({ publicId });
});

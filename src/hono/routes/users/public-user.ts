import { Hono, type MiddlewareHandler } from "hono";
import { getUserIdByPublicId, getUserMusic, getUserProfile } from "./service";
import type { UsersEnv } from "./types";

const publicUserMiddleware: MiddlewareHandler<UsersEnv> = async (c, next) => {
  const publicId = c.req.param("publicId");
  if (!publicId) {
    return c.json({ message: "User not found" } as const, 404);
  }

  const userId = await getUserIdByPublicId(c.env, publicId);
  if (!userId) {
    return c.json({ message: "User not found" } as const, 404);
  }

  c.set("userId", userId);
  await next();
};

export const publicUserRouter = new Hono<UsersEnv>()
  .use(publicUserMiddleware)
  .get("/", async (c) => {
    const profile = await getUserProfile(c.env, c.var.userId);
    if (!profile) {
      return c.json({ message: "User not found" } as const, 404);
    }

    return c.json(profile);
  })
  .get("/music", async (c) => {
    const music = await getUserMusic(c.env, c.var.userId);
    if (!music) {
      return c.json({ message: "User not found" } as const, 404);
    }

    return c.json(music);
  });

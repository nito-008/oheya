import { Hono, type MiddlewareHandler } from "hono";
import { userNotFound, type UsersEnv } from ".";
import { getUserAlbum, getUserIdByPublicId, getUserMusic, getUserProfile } from "./service";

const publicUserMiddleware: MiddlewareHandler<UsersEnv> = async (c, next) => {
  const publicId = c.req.param("publicId");
  if (!publicId) {
    return c.json(userNotFound, 404);
  }

  const userId = await getUserIdByPublicId(c.env, publicId);
  if (!userId) {
    return c.json(userNotFound, 404);
  }

  c.set("userId", userId);
  await next();
};

export const publicUserRouter = new Hono<UsersEnv>()
  .use(publicUserMiddleware)
  .get("/", async (c) => {
    const profile = await getUserProfile(c.env, c.var.userId);
    if (!profile) {
      return c.json(userNotFound, 404);
    }

    return c.json(profile);
  })
  .get("/music", async (c) => {
    const music = await getUserMusic(c.env, c.var.userId);
    if (!music) {
      return c.json(userNotFound, 404);
    }

    return c.json(music);
  })
  .get("/album", async (c) => {
    const album = await getUserAlbum(c.env, c.var.userId);
    if (!album) {
      return c.json(userNotFound, 404);
    }

    return c.json(album);
  });

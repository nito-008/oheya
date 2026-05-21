import { Hono, type MiddlewareHandler } from "hono";
import { PUBLIC_ID_MAX_LENGTH, publicIdPattern } from "~/schema/user";
import { userNotFound, type UsersEnv } from ".";
import { getProfileByPublicId, getPublicRoomByUserId, getUserAlbum, getUserMusic } from "./service";

const publicUserMiddleware: MiddlewareHandler<UsersEnv> = async (c, next) => {
  const publicId = c.req.param("publicId");
  if (!publicId || !publicIdPattern.test(publicId) || publicId.length > PUBLIC_ID_MAX_LENGTH) {
    return c.json(userNotFound, 404);
  }

  const profile = await getProfileByPublicId(c.env, publicId);
  if (!profile) {
    return c.json(userNotFound, 404);
  }

  c.set("publicProfile", {
    publicId: profile.publicId,
    name: profile.name,
    icon: profile.icon,
    ogp: profile.ogp,
  });
  c.set("userId", profile.userId);
  await next();
};

export const publicUserRouter = new Hono<UsersEnv>()
  .use(publicUserMiddleware)
  .get("/", async (c) => {
    return c.json(c.var.publicProfile);
  })
  .get("/room", async (c) => {
    const room = await getPublicRoomByUserId(c.env, c.var.publicProfile, c.var.userId);
    return c.json(room);
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

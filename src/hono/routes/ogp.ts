import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Bindings } from "~/hono/types";
import { createR2ImageResponse, getUserImageObjectKey } from "~/hono/utils/image";
import { getDb } from "~/lib/db";
import { profiles } from "~/lib/db/schema";
import { PUBLIC_ID_MAX_LENGTH, publicIdPattern } from "~/schema/user";

const ogpNotFound = { message: "OGP image not found" } as const;

export const ogpRouter = new Hono<{ Bindings: Bindings }>().get("/:publicId", async (c) => {
  const publicId = c.req.param("publicId");
  if (!publicId || !publicIdPattern.test(publicId) || publicId.length > PUBLIC_ID_MAX_LENGTH) {
    return c.json(ogpNotFound, 404);
  }

  const db = getDb(c.env);
  const [profile] = await db
    .select({ userId: profiles.userId, ogp: profiles.ogp })
    .from(profiles)
    .where(eq(profiles.publicId, publicId));
  if (!profile?.ogp) {
    return c.json(ogpNotFound, 404);
  }

  const object = await c.env.R2_BUCKET.get(getUserImageObjectKey(profile.userId, profile.ogp));
  if (!object) {
    return c.json(ogpNotFound, 404);
  }

  return createR2ImageResponse(object);
});

import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import { deleteOwnedImage } from "~/hono/utils/image";
import { getDb } from "~/lib/db";
import { images, profiles } from "~/lib/db/schema";
import { musicSelectionSchema } from "~/schema/music";
import { userSchema } from "~/schema/user";
import { getUserMusic, getUserProfile } from "./service";
import type { UsersEnv } from "./types";

export const currentUserRouter = new Hono<UsersEnv>()
  .use(authMiddleware)
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
  })
  .patch("/music", vValidator("json", musicSelectionSchema), async (c) => {
    const userId = c.var.userId;
    const { track } = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    if (!profile) {
      return c.json({ message: "User not found" } as const, 404);
    }

    await db
      .update(profiles)
      .set({
        musicTrackId: track?.id ?? null,
        musicTitle: track?.title ?? null,
        musicArtist: track?.artist ?? null,
        musicArtworkUrl: track?.artworkUrl ?? null,
        musicPreviewUrl: track?.previewUrl ?? null,
        musicTrackViewUrl: track?.trackViewUrl ?? null,
      })
      .where(eq(profiles.userId, userId));

    return c.body(null, 204);
  })
  .patch("/", vValidator("json", userSchema), async (c) => {
    const userId = c.var.userId;
    const values = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId, icon: profiles.icon })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const [existing] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.publicId, values.publicId));
    if (existing && existing.userId !== userId) {
      return c.json({ message: "User ID already exists" } as const, 409);
    }

    const icon = values.icon || null;
    if (icon) {
      const [image] = await db
        .select({ userId: images.userId })
        .from(images)
        .where(eq(images.id, icon));
      if (!image) {
        return c.json({ message: "Image not found" } as const, 404);
      }
      if (image.userId !== userId) {
        return c.json({ message: "Forbidden" } as const, 403);
      }
    }

    const profileValues = {
      publicId: values.publicId,
      name: values.name,
      icon,
    };

    if (profile) {
      await db.update(profiles).set(profileValues).where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        ...profileValues,
      });
    }

    if (profile?.icon && profile.icon !== icon) {
      await deleteOwnedImage(c.env, profile.icon, userId);
    }

    return c.body(null, 204);
  });

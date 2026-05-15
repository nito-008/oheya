import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import { deleteUnusedUserImages } from "~/hono/utils/image";
import { emptyOk } from "~/hono/utils/response";
import { getDb } from "~/lib/db";
import { albumPhotos, profiles } from "~/lib/db/schema";
import { albumSchema } from "~/schema/album";
import { musicSelectionSchema } from "~/schema/music";
import { userSchema } from "~/schema/user";
import { userNotFound, type UsersEnv } from ".";
import {
  getImageOwners,
  getUserAlbum,
  getUserMusic,
  getUserProfile,
  toAlbumPhotoRows,
} from "./service";

export const currentUserRouter = new Hono<UsersEnv>()
  .use(authMiddleware)
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
  })
  .patch("/album", vValidator("json", albumSchema), async (c) => {
    const userId = c.var.userId;
    const { photos } = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    if (!profile) {
      return c.json(userNotFound, 404);
    }

    const imageIds = photos.map((photo) => photo.imageId);
    const imageOwners = await getImageOwners(c.env, imageIds);
    const missingImageId = imageIds.find((imageId) => !imageOwners.has(imageId));
    if (missingImageId) {
      return c.json({ message: "Image not found" } as const, 404);
    }
    const forbiddenImageId = imageIds.find((imageId) => imageOwners.get(imageId) !== userId);
    if (forbiddenImageId) {
      return c.json({ message: "Forbidden" } as const, 403);
    }

    const previousPhotos = await db
      .select({ imageId: albumPhotos.imageId })
      .from(albumPhotos)
      .where(eq(albumPhotos.userId, userId));
    const nextImageIds = new Set(imageIds);
    const removedImageIds = previousPhotos
      .map((photo) => photo.imageId)
      .filter((imageId) => !nextImageIds.has(imageId));

    await db.transaction(async (tx) => {
      await tx.delete(albumPhotos).where(eq(albumPhotos.userId, userId));
      if (photos.length > 0) {
        await tx.insert(albumPhotos).values(toAlbumPhotoRows(userId, photos));
      }
    });

    await deleteUnusedUserImages(c.env, userId, removedImageIds);

    return emptyOk();
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
      return c.json(userNotFound, 404);
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

    return emptyOk();
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
      const imageOwners = await getImageOwners(c.env, [icon]);
      if (!imageOwners.has(icon)) {
        return c.json({ message: "Image not found" } as const, 404);
      }
      if (imageOwners.get(icon) !== userId) {
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
      await deleteUnusedUserImages(c.env, userId, [profile.icon]);
    }

    return emptyOk();
  });

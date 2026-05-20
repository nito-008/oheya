import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
import { createR2ImageResponse, deleteOwnedImage, getUserImageObjectKey } from "~/hono/utils/image";
import { emptyOk } from "~/hono/utils/response";
import { getDb } from "~/lib/db";
import { images } from "~/lib/db/schema";
import {
  imageIdPattern,
  isImageContentType,
  maxImageSizeBytes,
  maxUserImageStorageBytes,
} from "~/schema/image";

export const imagesRouter = new Hono<{ Bindings: Bindings }>()
  .get("/:imageId", async (c) => {
    const imageId = c.req.param("imageId");
    if (!imageIdPattern.test(imageId)) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    const db = getDb(c.env);
    const [image] = await db
      .select({ userId: images.userId })
      .from(images)
      .where(eq(images.id, imageId));
    if (!image) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    const object = await c.env.R2_BUCKET.get(getUserImageObjectKey(image.userId, imageId));
    if (!object) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    return createR2ImageResponse(object);
  })
  .post("/", authMiddleware, async (c) => {
    const userId = c.var.userId;
    const body = await c.req.parseBody();
    const image = body.image;
    if (!(image instanceof File)) {
      return c.json({ message: "Image is required" } as const, 400);
    }
    if (!isImageContentType(image.type)) {
      return c.json({ message: "Unsupported image type" } as const, 400);
    }
    if (image.size > maxImageSizeBytes) {
      return c.json({ message: "Image is too large" } as const, 400);
    }

    const imageId = crypto.randomUUID();
    const db = getDb(c.env);

    const isImageStorageReserved = await db.transaction(async (tx) => {
      const [usage] = await tx
        .select({
          byteSize: sql<number>`coalesce(sum(${images.byteSize}), 0)`,
        })
        .from(images)
        .where(eq(images.userId, userId));
      const usedByteSize = Number(usage.byteSize);
      if (usedByteSize + image.size > maxUserImageStorageBytes) {
        return false;
      }

      await tx.insert(images).values({ id: imageId, userId, byteSize: image.size });
      return true;
    });
    if (!isImageStorageReserved) {
      return c.json({ message: "Image storage limit exceeded" } as const, 400);
    }

    try {
      await c.env.R2_BUCKET.put(getUserImageObjectKey(userId, imageId), await image.arrayBuffer(), {
        httpMetadata: {
          contentType: image.type,
        },
      });
    } catch (error) {
      await db.delete(images).where(eq(images.id, imageId));
      throw error;
    }

    return c.json({ imageId, url: `/api/images/${imageId}` } as const, 201);
  })
  .delete("/:imageId", authMiddleware, async (c) => {
    const imageId = c.req.param("imageId");
    if (!imageIdPattern.test(imageId)) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    const userId = c.var.userId;
    const db = getDb(c.env);
    const [image] = await db
      .select({ userId: images.userId })
      .from(images)
      .where(eq(images.id, imageId));
    if (!image) {
      return c.json({ message: "Image not found" } as const, 404);
    }
    if (image.userId !== userId) {
      return c.json({ message: "Forbidden" } as const, 403);
    }

    await deleteOwnedImage(c.env, imageId, userId);
    return emptyOk();
  });

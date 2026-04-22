import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
import { applyR2HttpMetadata } from "~/hono/utils/image";
import { imageIdPattern, isImageContentType } from "~/schema/image";

const MAX_IMAGE_SIZE = 6 * 1024 * 1024;

export const imagesRouter = new Hono<{ Bindings: Bindings }>()
  .get("/:imageId", async (c) => {
    const imageId = c.req.param("imageId");
    if (!imageIdPattern.test(imageId)) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    const object = await c.env.R2_BUCKET.get(imageId);
    if (!object) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    const headers = new Headers();
    applyR2HttpMetadata(headers, object.httpMetadata);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(object.body, { status: 200, headers });
  })
  .post("/", authMiddleware, async (c) => {
    const body = await c.req.parseBody();
    const image = body.image;
    if (!(image instanceof File)) {
      return c.json({ message: "Image is required" } as const, 400);
    }
    if (!isImageContentType(image.type)) {
      return c.json({ message: "Unsupported image type" } as const, 400);
    }
    if (image.size > MAX_IMAGE_SIZE) {
      return c.json({ message: "Image is too large" } as const, 400);
    }

    const imageId = crypto.randomUUID();
    await c.env.R2_BUCKET.put(imageId, await image.arrayBuffer(), {
      httpMetadata: {
        contentType: image.type,
      },
    });

    return c.json({ imageId, url: `/api/images/${imageId}` } as const, 201);
  })
  .delete("/:imageId", authMiddleware, async (c) => {
    const imageId = c.req.param("imageId");
    if (!imageIdPattern.test(imageId)) {
      return c.json({ message: "Image not found" } as const, 404);
    }

    await c.env.R2_BUCKET.delete(imageId);
    return c.body(null, 204);
  });

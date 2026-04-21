import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
import { getIconUrl, isExistingIconUrl, isInlineIconImage, uploadIcon } from "~/hono/utils/icon";
import { getDb } from "~/lib/db";
import { profiles } from "~/lib/db/schema";
import { userSchema } from "~/schema/user";

export const usersRouter = new Hono<{ Bindings: Bindings }>()
  .get("/me", authMiddleware, async (c) => {
    const userId = c.var.userId;
    const db = getDb(c.env);
    const [row] = await db
      .select({
        publicId: profiles.publicId,
        name: profiles.name,
        iconObjectKey: profiles.iconObjectKey,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({
      publicId: row.publicId,
      name: row.name,
      iconUrl: getIconUrl(row.publicId, row.iconObjectKey),
    });
  })
  .get("/:publicId/icon", async (c) => {
    const publicId = c.req.param("publicId");
    const db = getDb(c.env);
    const [row] = await db
      .select({ iconObjectKey: profiles.iconObjectKey })
      .from(profiles)
      .where(eq(profiles.publicId, publicId));
    if (!row?.iconObjectKey) {
      return c.json({ message: "Icon not found" } as const, 404);
    }

    const object = await c.env.R2_BUCKET.get(row.iconObjectKey);
    if (!object) {
      return c.json({ message: "Icon not found" } as const, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=60");
    return new Response(object.body, { status: 200, headers });
  })
  .get("/:publicId", async (c) => {
    const publicId = c.req.param("publicId");
    const db = getDb(c.env);
    const [row] = await db
      .select({
        publicId: profiles.publicId,
        name: profiles.name,
        iconObjectKey: profiles.iconObjectKey,
      })
      .from(profiles)
      .where(eq(profiles.publicId, publicId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({
      publicId: row.publicId,
      name: row.name,
      iconUrl: getIconUrl(row.publicId, row.iconObjectKey),
    });
  })
  .patch("/me", authMiddleware, vValidator("json", userSchema), async (c) => {
    const userId = c.var.userId;
    const values = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId, iconObjectKey: profiles.iconObjectKey })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const [existing] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.publicId, values.publicId));
    if (existing && existing.userId !== userId) {
      return c.json({ message: "User ID already exists" } as const, 409);
    }

    let iconObjectKey = profile?.iconObjectKey ?? null;
    const shouldKeepExistingIcon = isExistingIconUrl(values.iconUrl);
    const shouldUploadIcon = isInlineIconImage(values.iconUrl);
    const shouldRemoveIcon = values.iconUrl === "";

    if (shouldUploadIcon) {
      const uploadedIconObjectKey = await uploadIcon(c.env.R2_BUCKET, userId, values.iconUrl);
      if (!uploadedIconObjectKey) {
        return c.json({ message: "Invalid icon image" } as const, 400);
      }
      iconObjectKey = uploadedIconObjectKey;
    } else if (shouldRemoveIcon) {
      iconObjectKey = null;
    } else if (!shouldKeepExistingIcon) {
      return c.json({ message: "Invalid icon image" } as const, 400);
    }

    const profileValues = {
      publicId: values.publicId,
      name: values.name,
      iconObjectKey,
    };

    if (profile) {
      await db.update(profiles).set(profileValues).where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        ...profileValues,
      });
    }

    if (profile?.iconObjectKey && profile.iconObjectKey !== iconObjectKey) {
      await c.env.R2_BUCKET.delete(profile.iconObjectKey);
    }

    return c.body(null, 204);
  });

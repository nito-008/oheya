import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
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
        icon: profiles.icon,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({
      publicId: row.publicId,
      name: row.name,
      icon: row.icon,
    });
  })
  .get("/:publicId", async (c) => {
    const publicId = c.req.param("publicId");
    const db = getDb(c.env);
    const [row] = await db
      .select({
        publicId: profiles.publicId,
        name: profiles.name,
        icon: profiles.icon,
      })
      .from(profiles)
      .where(eq(profiles.publicId, publicId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({
      publicId: row.publicId,
      name: row.name,
      icon: row.icon,
    });
  })
  .patch("/me", authMiddleware, vValidator("json", userSchema), async (c) => {
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
      await c.env.R2_BUCKET.delete(profile.icon);
    }

    return c.body(null, 204);
  });

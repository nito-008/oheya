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
      .select({ publicId: profiles.publicId, name: profiles.name })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json(row);
  })
  .patch("/me", authMiddleware, vValidator("json", userSchema), async (c) => {
    const userId = c.var.userId;
    const values = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (profile) {
      return c.json({ message: "User already registered" } as const, 409);
    }

    const [existing] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.publicId, values.publicId));
    if (existing) {
      return c.json({ message: "User ID already exists" } as const, 409);
    }

    await db.insert(profiles).values({
      userId,
      publicId: values.publicId,
      name: values.name,
    });
    return c.body(null, 204);
  });

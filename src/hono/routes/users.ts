import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { userSchema } from "~/schema/user";

export const usersRouter = new Hono<{ Bindings: Bindings }>()
  .get("/me", authMiddleware, async (c) => {
    const userId = c.var.userId;
    const db = getDb(c.env);
    const [row] = await db
      .select({ publicId: users.publicId })
      .from(users)
      .where(eq(users.id, userId));
    if (!row?.publicId) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({ publicId: row.publicId });
  })
  .patch("/me", authMiddleware, vValidator("json", userSchema), async (c) => {
    const userId = c.var.userId;
    const values = c.req.valid("json");
    const db = getDb(c.env);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.publicId, values.publicId));
    if (existing) {
      return c.json({ message: "User ID already exists" } as const, 409);
    }

    await db
      .update(users)
      .set({ publicId: values.publicId, name: values.name })
      .where(eq(users.id, userId));
    return c.body(null, 204);
  });

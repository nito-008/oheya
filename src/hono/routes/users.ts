import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { userSchema } from "~/schema/user";

export const usersRouter = new Hono<{ Bindings: Bindings }>()
  .get("/me", async (c) => {
    const email = c.env.session?.user?.email;
    if (!email) return c.json({ state: "guest" } as const);

    const db = getDb(c.env.env);
    const [row] = await db
      .select({ publicId: users.publicId })
      .from(users)
      .where(eq(users.email, email));
    if (row?.publicId) return c.json({ state: "registered", publicId: row.publicId } as const);
    return c.json({ state: "needsProfile" } as const);
  })
  .patch("/me", requireAuth, vValidator("json", userSchema), async (c) => {
    const email = c.var.email;
    const values = c.req.valid("json");
    const db = getDb(c.env.env);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.publicId, values.publicId));
    if (existing) return c.json({ error: "duplicate_public_id" } as const, 409);

    await db
      .update(users)
      .set({ publicId: values.publicId, name: values.name })
      .where(eq(users.email, email));
    return c.json({ ok: true } as const);
  });

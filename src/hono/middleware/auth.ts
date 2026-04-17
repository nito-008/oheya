import type { MiddlewareHandler } from "hono";
import type { Bindings } from "~/hono/types";

export const requireAuth: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: { email: string };
}> = async (c, next) => {
  const email = c.env.session?.user?.email;
  if (!email) return c.json({ error: "unauthorized" } as const, 401);
  c.set("email", email);
  await next();
};

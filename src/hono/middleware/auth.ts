import type { MiddlewareHandler } from "hono";
import type { Bindings } from "~/hono/types";

export const authMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: { userId: string };
}> = async (c, next) => {
  const session = c.env.session;
  if (!session?.user?.id) return c.json({ message: "Unauthorized" } as const, 401);
  c.set("userId", session.user.id);
  await next();
};

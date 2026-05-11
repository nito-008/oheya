import { Hono } from "hono";
import type { Bindings } from "~/hono/types";
import { currentUserRouter } from "./current-user";
import { publicUserRouter } from "./public-user";

export const usersRouter = new Hono<{
  Bindings: Bindings;
  Variables: { userId: string };
}>()
  .route("/me", currentUserRouter)
  .route("/:publicId", publicUserRouter);

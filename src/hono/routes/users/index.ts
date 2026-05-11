import { Hono } from "hono";
import type { Bindings } from "~/hono/types";
import { currentUserRouter } from "./current-user";
import { publicUserRouter } from "./public-user";

export type UsersEnv = {
  Bindings: Bindings;
  Variables: { userId: string };
};

export const userNotFound = { message: "User not found" } as const;

export const usersRouter = new Hono<UsersEnv>()
  .route("/me", currentUserRouter)
  .route("/:publicId", publicUserRouter);

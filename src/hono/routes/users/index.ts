import { Hono } from "hono";
import { currentUserRouter } from "./current-user";
import { publicUserRouter } from "./public-user";
import type { UsersEnv } from "./types";

export const usersRouter = new Hono<UsersEnv>()
  .route("/me", currentUserRouter)
  .route("/:publicId", publicUserRouter);

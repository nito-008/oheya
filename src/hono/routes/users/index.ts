import { Hono } from "hono";
import type { Bindings } from "~/hono/types";
import { currentUserRouter } from "./current-user";
import { publicUserRouter } from "./public-user";
import { randomUserRouter } from "./random-user";

export type UsersEnv = {
  Bindings: Bindings;
  Variables: {
    publicProfile: PublicProfile;
    userId: string;
  };
};

export type PublicProfile = {
  icon: string | null;
  name: string;
  ogp: string | null;
  publicId: string;
};

export const userNotFound = { message: "User not found" } as const;

export const usersRouter = new Hono<UsersEnv>()
  .route("/me", currentUserRouter)
  .route("/random", randomUserRouter)
  .route("/:publicId", publicUserRouter);

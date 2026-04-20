import { Hono } from "hono";
import type { ApplyGlobalResponse } from "hono/client";
import { usersRouter } from "./routes/users";
import type { Bindings } from "./types";

export const app = new Hono<{ Bindings: Bindings }>().basePath("/api").route("/users", usersRouter);

export type AppType = ApplyGlobalResponse<
  typeof app,
  {
    401: { json: { message: string } };
  }
>;

import { Hono } from "hono";
import { usersRouter } from "./routes/users";
import type { Bindings } from "./types";

export const app = new Hono<{ Bindings: Bindings }>().basePath("/api").route("/users", usersRouter);

export type AppType = typeof app;

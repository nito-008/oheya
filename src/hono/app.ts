import { Hono } from "hono";
import type { ApplyGlobalResponse } from "hono/client";
import { logger } from "hono/logger";
import { imagesRouter } from "./routes/images";
import { musicRouter } from "./routes/music";
import { usersRouter } from "./routes/users";
import type { Bindings } from "./types";

export const app = new Hono<{ Bindings: Bindings }>()
  .basePath("/api")
  .use(logger())
  .onError((error, c) => {
    console.error(`[hono:error] ${c.req.method} ${c.req.path}`, error);
    return c.json({ message: "Internal Server Error" } as const, 500);
  })
  .route("/images", imagesRouter)
  .route("/music", musicRouter)
  .route("/users", usersRouter);

export type AppType = ApplyGlobalResponse<
  typeof app,
  {
    401: { json: { message: string } };
    500: { json: { message: string } };
  }
>;

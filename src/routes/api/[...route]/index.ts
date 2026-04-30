import type { Session } from "@auth/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { app } from "~/hono/app";
import { getPlatformEnv } from "~/lib/platform-env";

const handler: RequestHandler = async (event) => {
  const res = await app.fetch(event.request, {
    ...getPlatformEnv(event),
    session: event.sharedMap.get("session") as Session | null,
  });
  event.send(res);
};

export const onRequest: RequestHandler = handler;

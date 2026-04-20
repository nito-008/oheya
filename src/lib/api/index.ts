import type { Session } from "@auth/qwik";
import type { RequestEventCommon } from "@builder.io/qwik-city";
import { hc } from "hono/client";
import { type AppType, app } from "~/hono/app";

export function createApiClient(event: RequestEventCommon) {
  return hc<AppType>(event.url.origin, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      app.fetch(new Request(input, init), {
        ...event.platform.env,
        session: event.sharedMap.get("session") as Session | null,
      }),
  });
}

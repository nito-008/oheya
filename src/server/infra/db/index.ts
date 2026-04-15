import type { Client } from "@libsql/client";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const getDb = (client: Client) => drizzle(client, { schema });

export type Db = ReturnType<typeof getDb>;

export function isDbConfigured(
  ev: RequestEventBase,
): ev is RequestEventBase & { platform: { env: Env } } {
  const env = ev.platform?.env as Env | undefined;
  return Boolean(env?.TURSO_DATABASE_URL);
}

export { schema };

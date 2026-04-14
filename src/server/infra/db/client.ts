import { createClient, type Client } from "@libsql/client";

export const createTursoClient = (env: {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
}): Client =>
  createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

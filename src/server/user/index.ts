import { eq } from "drizzle-orm";
import { getDb } from "~/server/infra/db";
import { createTursoClient } from "~/server/infra/db/client";
import { users } from "~/server/infra/db/schema";

export async function getPublicIdByEmail(env: Env, email: string): Promise<string | null> {
  const db = getDb(createTursoClient(env));
  const [row] = await db
    .select({ publicId: users.publicId })
    .from(users)
    .where(eq(users.email, email));
  return row?.publicId ?? null;
}

export type RegisterProfileResult = "ok" | "duplicate_public_id";

export async function registerProfile(
  env: Env,
  email: string,
  profile: { publicId: string; name: string },
): Promise<RegisterProfileResult> {
  const db = getDb(createTursoClient(env));

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.publicId, profile.publicId));
  if (existing) return "duplicate_public_id";

  await db
    .update(users)
    .set({ publicId: profile.publicId, name: profile.name })
    .where(eq(users.email, email));
  return "ok";
}

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import { getDb } from "~/server/infra/db";
import { createTursoClient } from "~/server/infra/db/client";
import { accounts, sessions, users, verificationTokens } from "~/server/infra/db/schema";
import { allocateRoom } from "~/server/usecase/rooms/allocateRoom";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$((ev) => {
  const env = ev.platform?.env as Env | undefined;
  const db = env?.TURSO_DATABASE_URL ? getDb(createTursoClient(env)) : undefined;

  return {
    providers: [Google],
    ...(db && {
      adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
      session: { strategy: "database" },
      events: {
        signIn: async ({ user, isNewUser }) => {
          if (isNewUser && user?.id) await allocateRoom(db, user.id);
        },
      },
    }),
  };
});

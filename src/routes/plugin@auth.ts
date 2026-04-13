import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import { getDb } from "~/server/infra/db";
import { accounts, sessions, users, verificationTokens } from "~/server/infra/db/schema";
import { allocateRoom } from "~/server/usecase/rooms/allocateRoom";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$((ev) => {
  const d1 = (ev.platform?.env as Env | undefined)?.DB;
  const db = d1 ? getDb(d1) : undefined;

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

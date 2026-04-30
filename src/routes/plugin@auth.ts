import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import { getDb } from "~/lib/db";
import { accounts, sessions, users, verificationTokens } from "~/lib/db/schema";
import { getPlatformEnv } from "~/lib/platform-env";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$((event) => {
  const db = getDb(getPlatformEnv(event));

  return {
    trustHost: true,
    providers: [Google],
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "database" },
    callbacks: {
      session({ session, user }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
          },
        };
      },
    },
  };
});

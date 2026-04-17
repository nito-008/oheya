import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import { getDb } from "~/lib/db";
import { accounts, sessions, users, verificationTokens } from "~/lib/db/schema";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$((event) => {
  const db = getDb(event.platform.env);

  return {
    providers: [Google],
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "database" },
  };
});

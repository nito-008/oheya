import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import { getDb } from "~/server/infra/db";
import { createTursoClient } from "~/server/infra/db/client";
import { accounts, sessions, users, verificationTokens } from "~/server/infra/db/schema";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$((ev) => {
  const db = getDb(createTursoClient(ev.platform.env));

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

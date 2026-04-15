import { component$, Slot } from "@builder.io/qwik";
import type { Session } from "@auth/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { CommonHeader } from "~/components/common-header/common-header";
import { isDbConfigured } from "~/server/infra/db";
import { getPublicIdByEmail } from "~/server/user";

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: new Date().toISOString(),
  };
});

export const useProfileGuard = routeLoader$(async (ev) => {
  const session = ev.sharedMap.get("session") as Session | null;
  if (!session?.user?.email) return;
  if (ev.url.pathname === "/signup") return;
  if (!isDbConfigured(ev)) return;

  const publicId = await getPublicIdByEmail(ev.platform.env, session.user.email);
  if (!publicId) {
    throw ev.redirect(302, "/signup");
  }
});

export default component$(() => {
  return (
    <>
      <CommonHeader />
      <main>
        <Slot />
      </main>
    </>
  );
});

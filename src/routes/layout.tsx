import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { CommonHeader, type CommonHeaderUser } from "~/components/common-header/common-header";
import { createApiClient } from "~/lib/api";

export const useHeaderUser = routeLoader$<CommonHeaderUser>(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$get();

  if (res.ok) {
    const user = await res.json();
    return {
      authenticated: true,
      publicId: user.publicId,
      name: user.name,
      icon: user.icon,
    };
  }

  if (res.status === 401) {
    return { authenticated: false, publicId: null, name: null, icon: null };
  }

  if (res.status === 404) {
    return { authenticated: false, publicId: null, name: null, icon: null };
  }

  throw new Error("ユーザー情報を取得できませんでした");
});

export default component$(() => {
  const headerUser = useHeaderUser();
  const location = useLocation();
  const showAuthActions = location.url.pathname !== "/signup/";

  return (
    <>
      <CommonHeader user={headerUser.value} showAuthActions={showAuthActions} />
      <main>
        <Slot />
      </main>
    </>
  );
});

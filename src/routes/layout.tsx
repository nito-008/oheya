import { $, component$, Slot, useContextProvider, useStore, useTask$ } from "@builder.io/qwik";
import { ErrorBoundary, routeLoader$, useLocation } from "@builder.io/qwik-city";
import { CommonFooter } from "~/components/common-footer/common-footer";
import { CommonHeader } from "~/components/common-header/common-header";
import {
  CommonHeaderUserContext,
  type CommonHeaderUser,
} from "~/components/common-header/common-header-state";
import { createApiClient } from "~/lib/api";
import { ErrorPage, getErrorPageMessage } from "./components/error-page/error-page";
import styles from "./layout.module.css";

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

  if (res.status === 401 || res.status === 404) {
    return { authenticated: false, publicId: null, name: null, icon: null };
  }

  throw new Error("ユーザー情報を取得できませんでした");
});

export default component$(() => {
  const loadedHeaderUser = useHeaderUser();
  const headerUser = useStore<CommonHeaderUser>({ ...loadedHeaderUser.value }, { deep: false });
  const location = useLocation();
  const showAuthActions = location.url.pathname !== "/signup/";

  useContextProvider(CommonHeaderUserContext, headerUser);

  useTask$(({ track }) => {
    const nextHeaderUser = track(() => loadedHeaderUser.value);
    headerUser.authenticated = nextHeaderUser.authenticated;
    headerUser.publicId = nextHeaderUser.publicId;
    headerUser.name = nextHeaderUser.name;
    headerUser.icon = nextHeaderUser.icon;
  });

  return (
    <div class={styles.appShell}>
      <CommonHeader
        user={headerUser}
        currentPath={location.url.pathname}
        showAuthActions={showAuthActions}
      />
      <main class={styles.pageContent}>
        <ErrorBoundary
          fallback$={$((error) => (
            <ErrorPage message={getErrorPageMessage(error)} />
          ))}
        >
          <Slot />
        </ErrorBoundary>
      </main>
      <CommonFooter user={headerUser} showAuthActions={showAuthActions} />
    </div>
  );
});

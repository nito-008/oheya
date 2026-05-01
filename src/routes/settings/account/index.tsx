import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import { AccountSettingsPanel } from "~/routes/settings/account/components/account-settings-panel/account-settings-panel";

type AccountSettingsLoaderData = {
  name: string;
};

export const useAccountSettingsLoader = routeLoader$<AccountSettingsLoaderData>(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$get();

  if (res.status === 401) throw event.redirect(302, "/");
  if (res.status === 404) throw event.redirect(302, "/signup");
  if (!res.ok) throw new Error("アカウント設定の読み込みに失敗しました");

  const profile = await res.json();
  return { name: profile.name };
});

export default component$(() => {
  const account = useAccountSettingsLoader();

  return <AccountSettingsPanel name={account.value.name} />;
});

export const head: DocumentHead = {
  title: "アカウント設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaのアカウント設定ページ" }],
};

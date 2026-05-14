import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import type { UserAlbumPhoto } from "~/schema/album";
import { AlbumSettingsForm } from "~/routes/settings/album/components/album-settings-form";

export const useAlbumSettingsLoader = routeLoader$<UserAlbumPhoto[]>(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.album.$get();

  if (res.status === 401) throw event.redirect(302, "/");
  if (res.status === 404) throw event.redirect(302, "/signup");
  if (!res.ok) throw new Error("アルバム設定の取得に失敗しました");

  const data = (await res.json()) as { photos: UserAlbumPhoto[] };
  return data.photos;
});

export default component$(() => {
  const photos = useAlbumSettingsLoader();

  return <AlbumSettingsForm initialPhotos={photos.value} />;
});

export const head: DocumentHead = {
  title: "アルバム設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaのアルバム設定ページ" }],
};

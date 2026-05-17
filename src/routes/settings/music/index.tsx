import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import type { MusicTrack } from "~/schema/music";
import { MusicSettingsForm } from "~/routes/settings/music/components/music-settings-form";

export const useMusicSettingsLoader = routeLoader$<MusicTrack | null>(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.music.$get();

  if (res.status === 401) throw event.redirect(302, "/");
  if (res.status === 404) throw event.redirect(302, "/signup/");
  if (!res.ok) throw new Error("音楽設定の取得に失敗しました");

  const data = (await res.json()) as { track: MusicTrack | null };
  return data.track;
});

export default component$(() => {
  const track = useMusicSettingsLoader();

  return <MusicSettingsForm initialTrack={track.value} />;
});

export const head: DocumentHead = {
  title: "音楽設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaの音楽設定ページ" }],
};

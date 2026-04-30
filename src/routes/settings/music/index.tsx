import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { MusicSettingsForm } from "~/routes/settings/music/components/music-settings-form";

export default component$(() => {
  return <MusicSettingsForm />;
});

export const head: DocumentHead = {
  title: "音楽設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaの音楽設定ページ" }],
};

import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Door } from "~/components/svg/door/door";
import { Jukebox } from "~/components/svg/jukebox/jukebox";

export default component$(() => {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <Door />
      <Jukebox />
    </main>
  );
});

export const head: DocumentHead = {
  title: "Oheya",
  meta: [{ name: "description", content: "インターネットのどこかにある、だれかのお部屋" }],
};

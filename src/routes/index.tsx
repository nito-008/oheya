import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Introduction } from "~/components/introduction/introduction";
import { Door } from "~/components/svg/door/door";

export default component$(() => {
  return (
    <main style={{ padding: "2rem" }}>
      <Introduction />
      <Door />
    </main>
  );
});

export const head: DocumentHead = {
  title: "Oheya",
  meta: [{ name: "description", content: "インターネットのどこかにある、誰かのお部屋" }],
};

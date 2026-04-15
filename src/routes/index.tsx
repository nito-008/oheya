import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Bio Tower</h1>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Bio Tower",
  meta: [{ name: "description", content: "Bioが積み上がる塔" }],
};

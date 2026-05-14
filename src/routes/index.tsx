import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Introduction } from "~/components/introduction/introduction";
import { Door } from "~/components/svg/door/door";
import styles from "./index.module.css";

export default component$(() => {
  return (
    <div class={styles.home}>
      <Introduction />
      <Door />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Oheya",
  meta: [{ name: "description", content: "インターネットのどこかにある、誰かのお部屋" }],
};

import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import styles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";

export default component$(() => {
  return (
    <section class={styles.content}>
      <p>音楽設定は準備中です。</p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "音楽設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaの音楽設定ページ" }],
};

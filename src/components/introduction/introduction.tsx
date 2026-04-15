import { component$ } from "@builder.io/qwik";
import styles from "./introduction.module.css";

export const Introduction = component$(() => {
  return (
    <section class={styles.introduction}>
      <h2 class={styles.title}>
        ようこそ<span>Oheya</span>へ
      </h2>
      <p class={styles.lead}>
        ここは
        <wbr />
        インターネットの
        <wbr />
        どこかにある、
        <wbr />
        誰かのお部屋。
      </p>
      <p class={styles.lead}>少しのぞいてみませんか？</p>
    </section>
  );
});

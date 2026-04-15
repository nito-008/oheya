import { component$, useSignal } from "@builder.io/qwik";
import doorSvg from "~/media/door.svg?raw";
import styles from "./door.module.css";

export const Door = component$(() => {
  const open = useSignal(false);

  return (
    <div
      class={[styles.door, open.value && styles.open]}
      role="button"
      tabIndex={0}
      aria-pressed={open.value}
      aria-label={open.value ? "ドアを閉じる" : "ドアを開ける"}
      onClick$={() => (open.value = !open.value)}
      onKeyDown$={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open.value = !open.value;
        }
      }}
      dangerouslySetInnerHTML={doorSvg}
    />
  );
});

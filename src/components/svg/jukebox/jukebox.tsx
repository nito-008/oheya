import { component$, useSignal } from "@builder.io/qwik";
import jukeboxSvg from "~/media/jukebox.svg?raw";
import styles from "./jukebox.module.css";

export const Jukebox = component$(() => {
  const playing = useSignal(false);

  return (
    <div>
      <div
        class={[styles.jukebox, playing.value && styles.playing]}
        dangerouslySetInnerHTML={jukeboxSvg}
      />
      <button type="button" onClick$={() => (playing.value = !playing.value)}>
        {playing.value ? "停止" : "再生"}
      </button>
    </div>
  );
});

import { component$ } from "@builder.io/qwik";
import type { MusicTrack } from "~/schema/music";
import { SongJacket } from "~/routes/[userId]/components/music/song-jacket/song-jacket";
import styles from "./music.module.css";

type MusicProps = {
  track: MusicTrack | null;
};

export const Music = component$<MusicProps>(({ track }) => {
  return (
    <section id="music" class={styles.music} aria-label="音楽">
      <SongJacket track={track} />
    </section>
  );
});

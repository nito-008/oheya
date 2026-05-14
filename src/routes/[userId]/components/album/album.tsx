import { component$ } from "@builder.io/qwik";
import type { UserAlbumPhoto } from "~/schema/album";
import { AlbumGallery } from "~/routes/[userId]/components/album/album-gallery/album-gallery";
import styles from "./album.module.css";

type AlbumProps = {
  photos: UserAlbumPhoto[];
};

export const Album = component$<AlbumProps>(({ photos }) => {
  return (
    <section id="album" class={styles.album} aria-label="アルバム">
      <AlbumGallery photos={photos} />
    </section>
  );
});

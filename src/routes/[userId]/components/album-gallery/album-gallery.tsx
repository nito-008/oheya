import { component$ } from "@builder.io/qwik";
import type { UserAlbumPhoto } from "~/schema/album";
import { AlbumPhotoFrame } from "~/routes/[userId]/components/album-photo-frame/album-photo-frame";
import styles from "./album-gallery.module.css";

type AlbumGalleryProps = {
  photos: UserAlbumPhoto[];
};

export const AlbumGallery = component$<AlbumGalleryProps>(({ photos }) => {
  if (photos.length === 0) {
    return (
      <div class={styles.emptyAlbum} aria-label="アルバム">
        <AlbumPhotoFrame />
      </div>
    );
  }

  return (
    <div class={styles.albumGallery} aria-label="アルバム">
      {photos.map((photo) => (
        <article key={photo.imageId} class={styles.photoCard}>
          <AlbumPhotoFrame imageUrl={photo.url} alt={photo.title || "アルバム写真"} />
          {(photo.title || photo.subtitle) && (
            <div class={styles.photoMeta}>
              {photo.title && <h2>{photo.title}</h2>}
              {photo.subtitle && <p>{photo.subtitle}</p>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
});

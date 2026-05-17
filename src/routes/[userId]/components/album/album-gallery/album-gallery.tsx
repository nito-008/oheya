import { component$ } from "@builder.io/qwik";
import type { UserAlbumPhoto } from "~/schema/album";
import {
  AlbumPhotoFrame,
  albumPhotoFrameVariantCount,
} from "~/routes/[userId]/components/album/album-photo-frame/album-photo-frame";
import styles from "./album-gallery.module.css";

type AlbumGalleryProps = {
  photos: UserAlbumPhoto[];
};

const getPhotoAlt = (photo: UserAlbumPhoto) => photo.title.trim() || "アルバム写真";

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
      {photos.map((photo, index) => {
        const title = photo.title.trim();
        const subtitle = photo.subtitle.trim();
        const hasMeta = Boolean(title || subtitle);

        return (
          <article key={photo.imageId} class={styles.photoCard}>
            <AlbumPhotoFrame
              imageUrl={photo.url}
              alt={getPhotoAlt(photo)}
              variant={index % albumPhotoFrameVariantCount}
            />
            <div class={styles.photoMeta} aria-hidden={hasMeta ? undefined : "true"}>
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            <div class={styles.photoCardSpacer} aria-hidden="true" />
          </article>
        );
      })}
    </div>
  );
});

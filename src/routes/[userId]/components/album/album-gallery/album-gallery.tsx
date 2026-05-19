import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { albumPhotoImageHeight, albumPhotoImageWidth, type UserAlbumPhoto } from "~/schema/album";
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
  const selectedPhotoId = useSignal<string | null>(null);
  const viewerRef = useSignal<HTMLDivElement>();
  const closePhotoViewer = $(() => {
    selectedPhotoId.value = null;
  });
  const selectedPhoto = photos.find((photo) => photo.imageId === selectedPhotoId.value);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    const isOpen = track(() => selectedPhotoId.value !== null);
    const viewer = viewerRef.value;
    if (!isOpen || !viewer) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") selectedPhotoId.value = null;
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    viewer.focus();

    cleanup(() => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    });
  });

  if (photos.length === 0) {
    return (
      <div class={styles.emptyAlbum} aria-label="アルバム">
        <AlbumPhotoFrame />
      </div>
    );
  }

  return (
    <>
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
                onOpen$={$(() => {
                  selectedPhotoId.value = photo.imageId;
                })}
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
      {selectedPhoto && (
        <div
          ref={viewerRef}
          class={styles.photoViewer}
          role="dialog"
          aria-label="写真ビューア"
          aria-modal="true"
          tabIndex={-1}
          onClick$={closePhotoViewer}
        >
          <button
            type="button"
            class={styles.photoViewerClose}
            aria-label="写真ビューアを閉じる"
            onClick$={closePhotoViewer}
          >
            <span aria-hidden="true" />
          </button>
          <div class={styles.photoViewerContent}>
            <img
              src={selectedPhoto.url}
              alt={getPhotoAlt(selectedPhoto)}
              width={albumPhotoImageWidth}
              height={albumPhotoImageHeight}
              class={styles.viewerImage}
              onClick$={(event) => {
                event.stopPropagation();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
});

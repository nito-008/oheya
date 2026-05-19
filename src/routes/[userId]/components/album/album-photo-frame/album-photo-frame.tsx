import { component$, type QRL } from "@builder.io/qwik";
import albumPhotoFrameSvg from "~/media/album-photo-frame.svg";
import photoPlaceholderSvg from "~/media/photo-placeholder.svg";
import { albumPhotoImageHeight, albumPhotoImageWidth } from "~/schema/album";
import styles from "./album-photo-frame.module.css";

type AlbumPhotoFrameProps = {
  imageUrl?: string | null;
  alt?: string;
  variant?: number;
  onOpen$?: QRL<() => void | Promise<void>>;
};

const frameVariantClassNames = [
  styles.frameVariantA,
  styles.frameVariantB,
  styles.frameVariantC,
  styles.frameVariantD,
];

export const albumPhotoFrameVariantCount = frameVariantClassNames.length;

const getFrameVariantClassName = (variant: number) => {
  const variantIndex =
    ((variant % albumPhotoFrameVariantCount) + albumPhotoFrameVariantCount) %
    albumPhotoFrameVariantCount;

  return frameVariantClassNames[variantIndex];
};

export const AlbumPhotoFrame = component$<AlbumPhotoFrameProps>(
  ({ imageUrl, alt = "", variant = 0, onOpen$ }) => {
    const frameVariantClassName = getFrameVariantClassName(variant);
    const openLabel = alt ? `${alt}の詳細を見る` : "写真の詳細を見る";

    return (
      <figure class={styles.albumPhotoFrame}>
        <div class={`${styles.frameShell} ${frameVariantClassName}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={alt}
              width={albumPhotoImageWidth}
              height={albumPhotoImageHeight}
              class={styles.photoImage}
            />
          ) : (
            <div class={styles.photoFallback} aria-hidden="true">
              <img
                src={photoPlaceholderSvg}
                alt=""
                width={96}
                height={96}
                class={styles.placeholderImage}
              />
            </div>
          )}
          {imageUrl && onOpen$ && (
            <button
              type="button"
              class={styles.openAction}
              aria-label={openLabel}
              onClick$={onOpen$}
            />
          )}
          {imageUrl && !onOpen$ && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              class={styles.openAction}
              aria-label="写真を新しいタブで開く"
            />
          )}
          <img
            src={albumPhotoFrameSvg}
            alt=""
            width={480}
            height={360}
            class={styles.frameImage}
            aria-hidden="true"
          />
        </div>
      </figure>
    );
  },
);

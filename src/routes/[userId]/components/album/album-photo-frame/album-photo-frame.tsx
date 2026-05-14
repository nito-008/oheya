import { component$ } from "@builder.io/qwik";
import albumPhotoFrameSvg from "~/media/album-photo-frame.svg";
import styles from "./album-photo-frame.module.css";

type AlbumPhotoFrameProps = {
  imageUrl?: string | null;
  alt?: string;
  variant?: number;
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
  ({ imageUrl, alt = "", variant = 0 }) => {
    const frameVariantClassName = getFrameVariantClassName(variant);

    return (
      <figure class={styles.albumPhotoFrame}>
        <div class={`${styles.frameShell} ${frameVariantClassName}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={alt} width={800} height={600} class={styles.photoImage} />
          ) : (
            <div class={styles.photoFallback} aria-hidden="true" />
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

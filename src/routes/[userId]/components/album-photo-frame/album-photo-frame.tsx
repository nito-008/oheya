import { component$ } from "@builder.io/qwik";
import albumPhotoFrameSvg from "~/media/album-photo-frame.svg";
import styles from "./album-photo-frame.module.css";

type AlbumPhotoFrameProps = {
  imageUrl?: string | null;
  alt?: string;
};

export const AlbumPhotoFrame = component$<AlbumPhotoFrameProps>(({ imageUrl, alt = "" }) => (
  <figure class={styles.albumPhotoFrame}>
    <div class={styles.frameShell}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} width={800} height={600} class={styles.photoImage} />
      ) : (
        <div class={styles.photoFallback} aria-hidden="true" />
      )}
      <img
        src={albumPhotoFrameSvg}
        alt=""
        width={400}
        height={300}
        class={styles.frameImage}
        aria-hidden="true"
      />
    </div>
  </figure>
));

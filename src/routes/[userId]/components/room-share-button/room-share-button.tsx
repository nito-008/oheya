import { component$ } from "@builder.io/qwik";
import shareSvg from "~/media/icons/share.svg";
import styles from "./room-share-button.module.css";

type RoomShareButtonProps = {
  href: string;
};

export const RoomShareButton = component$<RoomShareButtonProps>(({ href }) => (
  <div class={styles.action}>
    <a
      class={styles.link}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Xで共有"
    >
      <img class={styles.icon} src={shareSvg} alt="" width={24} height={24} />
      <span class={styles.label}>Xで共有</span>
    </a>
  </div>
));

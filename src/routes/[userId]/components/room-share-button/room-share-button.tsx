import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import shareSvg from "~/media/icons/share.svg";
import styles from "./room-share-button.module.css";

type RoomShareButtonProps = {
  roomUrl: string;
  text: string;
  xHref: string;
};

const expandedShareButtonMedia = "(min-width: 32rem)";

export const RoomShareButton = component$<RoomShareButtonProps>(({ roomUrl, text, xHref }) => {
  const compactShareButton = useSignal(false);
  const nativeShareSupported = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const mediaQuery = window.matchMedia(expandedShareButtonMedia);
    const syncCompactShareButton = () => {
      compactShareButton.value = !mediaQuery.matches;
    };

    nativeShareSupported.value = Boolean(navigator.share);
    syncCompactShareButton();

    mediaQuery.addEventListener("change", syncCompactShareButton);
    return () => mediaQuery.removeEventListener("change", syncCompactShareButton);
  });

  const share$ = $(() => {
    const openXShare = () => {
      if (window.open(xHref, "_blank", "noopener,noreferrer")) return;

      window.location.href = xHref;
    };

    if (!navigator.share || window.matchMedia(expandedShareButtonMedia).matches) {
      openXShare();
      return;
    }

    void navigator.share({ text, url: roomUrl }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;

      openXShare();
    });
  });

  const label = nativeShareSupported.value && compactShareButton.value ? "共有" : "Xで共有";

  return (
    <div class={styles.action}>
      <a
        class={styles.link}
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick$={share$}
        preventdefault:click
      >
        <img class={styles.icon} src={shareSvg} alt="" width={24} height={24} />
        <span class={styles.label}>{label}</span>
      </a>
    </div>
  );
});

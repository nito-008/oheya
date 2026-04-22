import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import carouselArrowSvg from "~/media/carousel-arrow.svg";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import { getImageUrl } from "~/schema/image";
import styles from "./profile-carousel.module.css";

type ProfileCarouselProps = {
  profile: {
    icon: string | null;
    name: string;
    publicId: string;
  };
};

export const ProfileCarousel = component$<ProfileCarouselProps>(({ profile }) => {
  const carouselRef = useSignal<HTMLDivElement>();
  const canScrollPrevious = useSignal(false);
  const canScrollNext = useSignal(true);

  const updateCarouselButtons$ = $(() => {
    const carousel = carouselRef.value;
    if (!carousel) return;

    const edgeThreshold = 2;
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    canScrollPrevious.value = carousel.scrollLeft > edgeThreshold;
    canScrollNext.value = carousel.scrollLeft < maxScrollLeft - edgeThreshold;
  });

  const scrollCarousel$ = $((direction: -1 | 1) => {
    const carousel = carouselRef.value;
    if (!carousel) return;

    const panel = carousel.querySelector<HTMLElement>(`.${styles.profilePanel}`);
    carousel.scrollBy({
      left: direction * (panel?.offsetWidth ?? carousel.clientWidth),
      behavior: "smooth",
    });
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const carousel = carouselRef.value;
    if (!carousel) return;

    const update = () => {
      void updateCarouselButtons$();
    };

    update();
    carousel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    cleanup(() => {
      carousel.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    });
  });

  return (
    <>
      <button
        class={`${styles.carouselButton} ${styles.carouselButtonPrevious}`}
        type="button"
        aria-label="前へ"
        disabled={!canScrollPrevious.value}
        onClick$={() => scrollCarousel$(-1)}
      >
        <img
          class={styles.carouselButtonMark}
          src={carouselArrowSvg}
          width={60}
          height={64}
          alt=""
          aria-hidden="true"
        />
      </button>
      <div ref={carouselRef} class={styles.profileCarousel} aria-label={`${profile.name}のお部屋`}>
        <section class={`${styles.profilePanel} ${styles.centerPanel}`} aria-label="プロフィール">
          <span class={styles.icon}>
            {profile.icon ? (
              <img
                src={getImageUrl(profile.icon) ?? ""}
                alt={`${profile.name}のアイコン`}
                width={96}
                height={96}
                class={styles.iconImage}
              />
            ) : (
              <img
                aria-hidden="true"
                src={iconPlaceholderSvg}
                alt=""
                width={96}
                height={96}
                class={styles.iconPlaceholder}
              />
            )}
            <img
              aria-hidden="true"
              src={iconFrameSvg}
              alt=""
              width={96}
              height={96}
              class={styles.iconFrame}
            />
          </span>
          <h1 class={styles.name}>{profile.name}</h1>
          <p class={styles.userId}>@{profile.publicId}</p>
        </section>
        <section
          class={`${styles.profilePanel} ${styles.sidePanelStart}`}
          aria-label="プロフィール左側"
        >
          <div class={styles.sidePanelFill} />
        </section>
        <section
          class={`${styles.profilePanel} ${styles.sidePanelEnd}`}
          aria-label="プロフィール右側"
        >
          <div class={styles.sidePanelFill} />
        </section>
      </div>
      <button
        class={`${styles.carouselButton} ${styles.carouselButtonNext}`}
        type="button"
        aria-label="次へ"
        disabled={!canScrollNext.value}
        onClick$={() => scrollCarousel$(1)}
      >
        <img
          class={`${styles.carouselButtonMark} ${styles.carouselButtonMarkNext}`}
          src={carouselArrowSvg}
          width={60}
          height={64}
          alt=""
          aria-hidden="true"
        />
      </button>
    </>
  );
});

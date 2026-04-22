import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import carouselArrowSvg from "~/media/carousel-arrow.svg";
import floorLineSvg from "~/media/floor-line.svg";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import profilePlusSvg from "~/media/profile-plus.svg";
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

    const panel = carousel.querySelector<HTMLElement>(`.${styles.carouselSlide}`);
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
    <div class={styles.profileCarousel}>
      <div ref={carouselRef} class={styles.carouselViewport} aria-label={`${profile.name}のお部屋`}>
        <section class={`${styles.carouselSlide} ${styles.profileSlide}`} aria-label="プロフィール">
          <div class={styles.profileBlock}>
            <img
              class={`${styles.cornerPlus} ${styles.cornerPlusTopLeft}`}
              src={profilePlusSvg}
              width={40}
              height={40}
              alt=""
              aria-hidden="true"
            />
            <span class={styles.avatar}>
              {profile.icon ? (
                <img
                  src={getImageUrl(profile.icon) ?? ""}
                  alt={`${profile.name}のアイコン`}
                  width={96}
                  height={96}
                  class={styles.avatarImage}
                />
              ) : (
                <img
                  aria-hidden="true"
                  src={iconPlaceholderSvg}
                  alt=""
                  width={96}
                  height={96}
                  class={styles.avatarPlaceholder}
                />
              )}
              <img
                aria-hidden="true"
                src={iconFrameSvg}
                alt=""
                width={96}
                height={96}
                class={styles.avatarFrame}
              />
            </span>
            <h1 class={styles.profileName}>{profile.name}</h1>
            <p class={styles.profileHandle}>@{profile.publicId}</p>
            <img
              class={`${styles.cornerPlus} ${styles.cornerPlusBottomRight}`}
              src={profilePlusSvg}
              width={40}
              height={40}
              alt=""
              aria-hidden="true"
            />
          </div>
        </section>
        <section class={styles.carouselSlide} aria-label="プロフィール左側" />
        <section class={styles.carouselSlide} aria-label="プロフィール右側" />
      </div>
      <img
        class={styles.roomFloorLine}
        src={floorLineSvg}
        width={260}
        height={36}
        alt=""
        aria-hidden="true"
      />
      <div class={styles.carouselControls} role="group" aria-label="プロフィールの切り替え">
        <button
          class={`${styles.carouselControl} ${styles.carouselControlPrevious}`}
          type="button"
          aria-label="前へ"
          disabled={!canScrollPrevious.value}
          onClick$={() => scrollCarousel$(-1)}
        >
          <img
            class={styles.carouselControlIcon}
            src={carouselArrowSvg}
            width={38}
            height={40}
            alt=""
            aria-hidden="true"
          />
        </button>
        <button
          class={`${styles.carouselControl} ${styles.carouselControlNext}`}
          type="button"
          aria-label="次へ"
          disabled={!canScrollNext.value}
          onClick$={() => scrollCarousel$(1)}
        >
          <img
            class={`${styles.carouselControlIcon} ${styles.carouselControlIconNext}`}
            src={carouselArrowSvg}
            width={38}
            height={40}
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
});

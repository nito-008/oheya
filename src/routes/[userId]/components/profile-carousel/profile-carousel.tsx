import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import profilePlusSvg from "~/media/profile-plus.svg";
import scrollSvg from "~/media/scroll-hint.svg";
import { SongJacket } from "~/routes/[userId]/components/song-jacket/song-jacket";
import { getImageUrl } from "~/schema/image";
import styles from "./profile-carousel.module.css";

const SLIDE_COUNT = 3;

type ProfileCarouselProps = {
  initialSlide?: number;
  profile: {
    icon: string | null;
    name: string;
    publicId: string;
  };
};

export const ProfileCarousel = component$<ProfileCarouselProps>(({ initialSlide = 1, profile }) => {
  const carouselRef = useSignal<HTMLDivElement>();
  const currentSlide = useSignal(Math.min(Math.max(initialSlide, 1), SLIDE_COUNT));

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup, track }) => {
    track(() => initialSlide);
    const carousel = carouselRef.value;
    if (!carousel) return;

    const slidePaths = [
      `/${profile.publicId}/profile/`,
      `/${profile.publicId}/music/`,
      null,
    ] as const;
    const requestedSlide = Math.min(Math.max(initialSlide, 1), SLIDE_COUNT);

    const syncPath = (slideIndex: number) => {
      const nextPath = slidePaths[slideIndex - 1];
      if (!nextPath || window.location.pathname === nextPath) return;
      window.history.replaceState(window.history.state, "", nextPath);
    };

    const update = (options?: { syncPath?: boolean }) => {
      const panel = carousel.querySelector<HTMLElement>(`.${styles.carouselSlide}`);
      const slideWidth = panel?.offsetWidth ?? carousel.clientWidth;
      const slideIndex = slideWidth > 0 ? Math.round(carousel.scrollLeft / slideWidth) + 1 : 1;
      const nextSlide = Math.min(Math.max(slideIndex, 1), SLIDE_COUNT);
      const changed = nextSlide !== currentSlide.value;
      currentSlide.value = nextSlide;
      if (changed && options?.syncPath) syncPath(nextSlide);
    };

    const scrollToSlide = (slideIndex: number) => {
      const slides = carousel.querySelectorAll<HTMLElement>(`.${styles.carouselSlide}`);
      const slide = slides[slideIndex - 1];
      if (!slide) return;
      carousel.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
      currentSlide.value = slideIndex;
    };

    scrollToSlide(requestedSlide);
    update();

    const handleScroll = () => {
      update({ syncPath: true });
    };
    const handleResize = () => {
      update();
    };

    carousel.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize as EventListener);

    cleanup(() => {
      carousel.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize as EventListener);
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
          <img class={styles.scrollHint} src={scrollSvg} width={88} height={32} alt="スクロール" />
        </section>
        <section class={`${styles.carouselSlide} ${styles.musicSlide}`} aria-label="音楽">
          <SongJacket publicId={profile.publicId} />
        </section>
        <section class={styles.carouselSlide} aria-label="プロフィール右側" />
      </div>
      <div
        class={styles.carouselProgress}
        role="progressbar"
        aria-label="プロフィールの表示位置"
        aria-valuemin={1}
        aria-valuemax={SLIDE_COUNT}
        aria-valuenow={currentSlide.value}
      >
        {Array.from({ length: SLIDE_COUNT }, (_, index) => (
          <span
            key={index}
            class={{
              [styles.carouselProgressSegment]: true,
              [styles.carouselProgressSegmentActive]: index < currentSlide.value,
            }}
          />
        ))}
      </div>
    </div>
  );
});

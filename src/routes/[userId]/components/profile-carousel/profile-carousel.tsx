import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import profilePlusSvg from "~/media/profile-plus.svg";
import { MusicFrame } from "~/routes/[userId]/components/music-frame/music-frame";
import { getImageUrl } from "~/schema/image";
import styles from "./profile-carousel.module.css";

const SLIDE_COUNT = 3;

type ProfileCarouselProps = {
  profile: {
    icon: string | null;
    name: string;
    publicId: string;
  };
};

export const ProfileCarousel = component$<ProfileCarouselProps>(({ profile }) => {
  const carouselRef = useSignal<HTMLDivElement>();
  const currentSlide = useSignal(1);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const carousel = carouselRef.value;
    if (!carousel) return;

    const update = () => {
      const panel = carousel.querySelector<HTMLElement>(`.${styles.carouselSlide}`);
      const slideWidth = panel?.offsetWidth ?? carousel.clientWidth;
      const slideIndex = slideWidth > 0 ? Math.round(carousel.scrollLeft / slideWidth) + 1 : 1;
      currentSlide.value = Math.min(Math.max(slideIndex, 1), SLIDE_COUNT);
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
        <section class={`${styles.carouselSlide} ${styles.musicSlide}`} aria-label="音楽プレビュー">
          <MusicFrame />
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

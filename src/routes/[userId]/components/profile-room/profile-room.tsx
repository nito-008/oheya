import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import profilePlusSvg from "~/media/profile-plus.svg";
import nextHintSvg from "~/media/scroll-hint.svg";
import { AlbumGallery } from "~/routes/[userId]/components/album-gallery/album-gallery";
import { SongJacket } from "~/routes/[userId]/components/song-jacket/song-jacket";
import { getImageUrl } from "~/schema/image";
import styles from "./profile-room.module.css";

export type ProfileRoomSection = "profile" | "music" | "album";

const profileSectionIds = {
  profile: "profile",
  music: "music",
  album: "album",
} satisfies Record<ProfileRoomSection, string>;

const sectionOrder = Object.values(profileSectionIds);
const WHEEL_DELTA_THRESHOLD = 6;
const TOUCH_DELTA_THRESHOLD = 18;
const SECTION_CHANGE_LOCK_MS = 520;

type ProfileRoomProps = {
  albumPhotos: UserAlbumPhoto[];
  initialSection?: ProfileRoomSection;
  profile: {
    icon: string | null;
    name: string;
    publicId: string;
  };
  track: MusicTrack | null;
};

export const ProfileRoom = component$<ProfileRoomProps>(
  ({ albumPhotos, initialSection = "profile", profile, track }) => {
    const roomRef = useSignal<HTMLDivElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      const section = track(() => initialSection);
      const sectionId = profileSectionIds[section];
      const room = roomRef.value;
      const target = document.getElementById(sectionId);
      if (!room || !target) return;
      room.scrollTo({ top: target.offsetTop, behavior: "auto" });
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const room = roomRef.value;
      if (!room) return;

      let locked = false;
      let touchStartY: number | null = null;

      const getCurrentSectionIndex = () => {
        const sections = sectionOrder
          .map((sectionId) => document.getElementById(sectionId))
          .filter((section): section is HTMLElement => Boolean(section));
        const closestSection = sections.reduce(
          (closest, section, index) => {
            const distance = Math.abs(section.offsetTop - room.scrollTop);
            return distance < closest.distance ? { distance, index } : closest;
          },
          { distance: Number.POSITIVE_INFINITY, index: 0 },
        );
        return closestSection.index;
      };

      const moveSection = (direction: 1 | -1) => {
        if (locked) return;
        const nextIndex = Math.min(
          Math.max(getCurrentSectionIndex() + direction, 0),
          sectionOrder.length - 1,
        );
        const target = document.getElementById(sectionOrder[nextIndex]);
        if (!target) return;

        locked = true;
        room.scrollTo({ top: target.offsetTop, behavior: "smooth" });
        window.setTimeout(() => {
          locked = false;
        }, SECTION_CHANGE_LOCK_MS);
      };

      const handleWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) return;
        event.preventDefault();
        moveSection(event.deltaY > 0 ? 1 : -1);
      };

      const handleTouchStart = (event: TouchEvent) => {
        touchStartY = event.touches[0]?.clientY ?? null;
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (touchStartY === null) return;
        const touchY = event.touches[0]?.clientY;
        if (touchY === undefined) return;

        const deltaY = touchStartY - touchY;
        if (Math.abs(deltaY) < TOUCH_DELTA_THRESHOLD) return;
        event.preventDefault();
        touchStartY = null;
        moveSection(deltaY > 0 ? 1 : -1);
      };

      room.addEventListener("wheel", handleWheel, { passive: false });
      room.addEventListener("touchstart", handleTouchStart, { passive: true });
      room.addEventListener("touchmove", handleTouchMove, { passive: false });

      cleanup(() => {
        room.removeEventListener("wheel", handleWheel);
        room.removeEventListener("touchstart", handleTouchStart);
        room.removeEventListener("touchmove", handleTouchMove);
      });
    });

    return (
      <div ref={roomRef} class={styles.profileRoom} aria-label={`${profile.name}のプロフィール`}>
        <section
          id={profileSectionIds.profile}
          class={`${styles.profileSection} ${styles.profileIntro}`}
          aria-label="プロフィール"
        >
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
          <img class={styles.nextHint} src={nextHintSvg} width={88} height={32} alt="スクロール" />
        </section>
        <section
          id={profileSectionIds.music}
          class={`${styles.profileSection} ${styles.musicSection}`}
          aria-label="音楽"
        >
          <SongJacket track={track} />
        </section>
        <section
          id={profileSectionIds.album}
          class={`${styles.profileSection} ${styles.albumSection}`}
          aria-label="アルバム"
        >
          <AlbumGallery photos={albumPhotos} />
        </section>
      </div>
    );
  },
);

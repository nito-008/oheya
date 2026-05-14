import { component$, useVisibleTask$ } from "@builder.io/qwik";
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
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      const section = track(() => initialSection);
      const sectionId = profileSectionIds[section];
      const target = document.getElementById(sectionId);
      target?.scrollIntoView({ block: "start", behavior: "auto" });
    });

    return (
      <div class={styles.profileRoom} aria-label={`${profile.name}のプロフィール`}>
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

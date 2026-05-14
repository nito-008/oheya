import { component$ } from "@builder.io/qwik";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import { ProfileCarousel } from "~/routes/[userId]/components/profile-carousel/profile-carousel";
import styles from "~/routes/[userId]/index.module.css";

type RoomProfile = {
  icon: string | null;
  name: string;
  publicId: string;
};

type ProfileRoomPageProps = {
  albumPhotos: UserAlbumPhoto[];
  initialSlide?: number;
  profile: RoomProfile;
  track: MusicTrack | null;
};

export const ProfileRoomPage = component$<ProfileRoomPageProps>(
  ({ albumPhotos, initialSlide = 1, profile, track }) => {
    return (
      <main class={styles.main}>
        <ProfileCarousel
          profile={profile}
          albumPhotos={albumPhotos}
          track={track}
          initialSlide={initialSlide}
        />
      </main>
    );
  },
);

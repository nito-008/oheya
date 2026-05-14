import { component$ } from "@builder.io/qwik";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import { ProfileRoom } from "~/routes/[userId]/components/profile-room/profile-room";
import styles from "~/routes/[userId]/index.module.css";

type RoomProfile = {
  icon: string | null;
  name: string;
  publicId: string;
};

type ProfileRoomPageProps = {
  albumPhotos: UserAlbumPhoto[];
  profile: RoomProfile;
  track: MusicTrack | null;
};

export const ProfileRoomPage = component$<ProfileRoomPageProps>(
  ({ albumPhotos, profile, track }) => {
    return (
      <main class={styles.main}>
        <ProfileRoom profile={profile} albumPhotos={albumPhotos} track={track} />
      </main>
    );
  },
);

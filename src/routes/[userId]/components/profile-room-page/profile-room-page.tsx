import { component$ } from "@builder.io/qwik";
import { ProfileCarousel } from "~/routes/[userId]/components/profile-carousel/profile-carousel";
import styles from "~/routes/[userId]/index.module.css";

type RoomProfile = {
  icon: string | null;
  name: string;
  publicId: string;
};

type ProfileRoomPageProps = {
  initialSlide?: number;
  profile: RoomProfile;
};

export const ProfileRoomPage = component$<ProfileRoomPageProps>(({ initialSlide = 1, profile }) => {
  return (
    <main class={styles.main}>
      <ProfileCarousel profile={profile} initialSlide={initialSlide} />
    </main>
  );
});

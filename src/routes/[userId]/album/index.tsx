import { component$ } from "@builder.io/qwik";
import { ProfileRoomPage } from "~/routes/[userId]/components/profile-room-page/profile-room-page";
import { head, useProfile } from "~/routes/[userId]/index";

export { head, useProfile };

export default component$(() => {
  const data = useProfile();

  return (
    <ProfileRoomPage
      profile={data.value.profile}
      albumPhotos={data.value.albumPhotos}
      track={data.value.track}
      initialSlide={3}
    />
  );
});

import { component$ } from "@builder.io/qwik";
import { ProfileRoomPage } from "~/routes/[userId]/components/profile-room-page/profile-room-page";
import { head, useProfile } from "~/routes/[userId]/index";

export { head, useProfile };

export default component$(() => {
  const profile = useProfile();

  return <ProfileRoomPage profile={profile.value} initialSlide={2} />;
});

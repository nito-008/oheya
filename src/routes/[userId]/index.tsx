import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import { ProfileRoomPage } from "~/routes/[userId]/components/profile-room-page/profile-room-page";

export const useProfile = routeLoader$(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users[":publicId"].$get({
    param: { publicId: event.params.userId },
  });

  if (res.status === 404) {
    throw event.error(404, "部屋が見つかりません");
  }

  if (!res.ok) {
    throw new Error("部屋に入れませんでした");
  }

  return res.json();
});

export default component$(() => {
  const profile = useProfile();

  return <ProfileRoomPage profile={profile.value} initialSlide={1} />;
});

export const head: DocumentHead = ({ resolveValue }) => {
  const profile = resolveValue(useProfile);

  return {
    title: `${profile.name} | Oheya`,
    meta: [{ name: "description", content: `${profile.name}のお部屋` }],
  };
};

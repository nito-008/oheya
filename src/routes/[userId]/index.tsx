import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import { ProfileRoomPage } from "~/routes/[userId]/components/profile-room-page/profile-room-page";

type ProfileLoaderData = {
  profile: {
    icon: string | null;
    name: string;
    publicId: string;
  };
  albumPhotos: UserAlbumPhoto[];
  track: MusicTrack | null;
};

export const useProfile = routeLoader$<ProfileLoaderData>(async (event) => {
  const client = createApiClient(event);
  const publicId = event.params.userId;

  const [profileRes, musicRes, albumRes] = await Promise.all([
    client.api.users[":publicId"].$get({
      param: { publicId },
    }),
    client.api.users[":publicId"].music.$get({
      param: { publicId },
    }),
    client.api.users[":publicId"].album.$get({
      param: { publicId },
    }),
  ]);

  if (profileRes.status === 404 || musicRes.status === 404 || albumRes.status === 404) {
    throw event.error(404, "プロフィールが見つかりません");
  }

  if (!profileRes.ok) {
    throw new Error("プロフィールの取得に失敗しました");
  }

  if (!musicRes.ok) {
    throw new Error("音楽情報の取得に失敗しました");
  }
  if (!albumRes.ok) {
    throw new Error("アルバムの取得に失敗しました");
  }

  const profile = await profileRes.json();
  const music = (await musicRes.json()) as { track: MusicTrack | null };
  const album = (await albumRes.json()) as { photos: UserAlbumPhoto[] };

  return {
    profile,
    albumPhotos: album.photos,
    track: music.track,
  };
});

export default component$(() => {
  const data = useProfile();

  return (
    <ProfileRoomPage
      profile={data.value.profile}
      albumPhotos={data.value.albumPhotos}
      track={data.value.track}
      initialSection="profile"
    />
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useProfile);

  return {
    title: `${data.profile.name} | Oheya`,
    meta: [{ name: "description", content: `${data.profile.name}のプロフィール` }],
  };
};

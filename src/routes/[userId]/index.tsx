import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import { Album } from "~/routes/[userId]/components/album/album";
import { Music } from "~/routes/[userId]/components/music/music";
import { Profile } from "~/routes/[userId]/components/profile/profile";
import { PUBLIC_ID_MAX_LENGTH, publicIdPattern } from "~/schema/user";
import styles from "./index.module.css";

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

  if (!publicIdPattern.test(publicId) || publicId.length > PUBLIC_ID_MAX_LENGTH) {
    throw event.error(404, "プロフィールが見つかりません");
  }

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
    <div class={styles.main} aria-label={`${data.value.profile.name}のプロフィール`}>
      <Profile profile={data.value.profile} />
      <Music track={data.value.track} />
      <Album photos={data.value.albumPhotos} />
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useProfile);

  return {
    title: `${data.profile.name} | Oheya`,
    meta: [{ name: "description", content: `${data.profile.name}のプロフィール` }],
  };
};

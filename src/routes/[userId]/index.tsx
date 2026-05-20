import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import { Album } from "~/routes/[userId]/components/album/album";
import { Music } from "~/routes/[userId]/components/music/music";
import { Profile } from "~/routes/[userId]/components/profile/profile";
import { RandomRoomButton } from "~/routes/[userId]/components/random-room-button/random-room-button";
import { RoomShareButton } from "~/routes/[userId]/components/room-share-button/room-share-button";
import { ErrorPage } from "~/routes/components/error-page/error-page";
import { PUBLIC_ID_MAX_LENGTH, publicIdPattern } from "~/schema/user";
import { getUserRoomHref } from "~/lib/room";
import styles from "./index.module.css";

const ROOM_NOT_FOUND_MESSAGE = "お部屋が見つかりません";

type PublicProfile = {
  icon: string | null;
  name: string;
  ogp: string | null;
  publicId: string;
};

type ProfileLoaderData =
  | {
      status: "found";
      profile: PublicProfile;
      albumPhotos: UserAlbumPhoto[];
      xShareHref: string;
      track: MusicTrack | null;
    }
  | {
      status: "notFound";
      message: string;
    };

type FoundProfileLoaderData = Extract<ProfileLoaderData, { status: "found" }>;

const createNotFoundProfileData = (): ProfileLoaderData => ({
  status: "notFound",
  message: ROOM_NOT_FOUND_MESSAGE,
});

const createXRoomShareHref = (profile: PublicProfile, originUrl: URL) => {
  const roomUrl = new URL(getUserRoomHref(profile.publicId), originUrl);
  const shareUrl = new URL("https://x.com/intent/tweet");
  shareUrl.searchParams.set("text", `${profile.name}のお部屋 #Oheya\n${roomUrl.toString()}`);
  return shareUrl.toString();
};

const createFoundProfileData = (
  profile: PublicProfile,
  albumPhotos: UserAlbumPhoto[],
  track: MusicTrack | null,
  originUrl: URL,
): FoundProfileLoaderData => {
  return {
    status: "found",
    profile,
    albumPhotos,
    xShareHref: createXRoomShareHref(profile, originUrl),
    track,
  };
};

export const useProfile = routeLoader$<ProfileLoaderData>(async (event) => {
  const client = createApiClient(event);
  const publicId = event.params.userId;

  if (!publicIdPattern.test(publicId) || publicId.length > PUBLIC_ID_MAX_LENGTH) {
    event.status(404);
    return createNotFoundProfileData();
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
    event.status(404);
    return createNotFoundProfileData();
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

  return createFoundProfileData(profile, album.photos, music.track, event.url);
});

export default component$(() => {
  const data = useProfile();

  if (data.value.status === "notFound") {
    return <ErrorPage message={data.value.message} />;
  }

  return (
    <div class={styles.main} aria-label={`${data.value.profile.name}のお部屋`}>
      <Profile profile={data.value.profile} />
      <Music track={data.value.track} />
      <Album photos={data.value.albumPhotos} />
      <RoomShareButton xHref={data.value.xShareHref} />
      <RandomRoomButton currentPublicId={data.value.profile.publicId} />
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useProfile);

  if (data.status === "notFound") {
    return {
      title: `${data.message} | Oheya`,
    };
  }

  return {
    title: `${data.profile.name} | Oheya`,
    meta: [
      { name: "description", content: `${data.profile.name}のお部屋` },
      ...(data.profile.ogp
        ? [{ property: "og:image", content: `/api/ogp/${data.profile.publicId}` }]
        : []),
    ],
  };
};

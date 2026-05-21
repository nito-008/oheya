import { eq, inArray, ne, sql } from "drizzle-orm";
import type { Bindings } from "~/hono/types";
import { getUserImageObjectKey } from "~/hono/utils/image";
import { getDb } from "~/lib/db";
import { accounts, albumPhotos, images, music, profiles, sessions, users } from "~/lib/db/schema";
import type { AlbumPhoto } from "~/schema/album";
import { getImageUrl } from "~/schema/image";
import type { MusicTrack } from "~/schema/music";

const publicIdMatches = (publicId: string) => sql`lower(${profiles.publicId}) = lower(${publicId})`;

export const getProfileByPublicId = async (env: Bindings, publicId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select({ userId: profiles.userId, publicId: profiles.publicId, ogp: profiles.ogp })
    .from(profiles)
    .where(publicIdMatches(publicId));

  return profile ?? null;
};

export const getUserIdByPublicId = async (env: Bindings, publicId: string) => {
  const profile = await getProfileByPublicId(env, publicId);
  return profile?.userId ?? null;
};

export const getRandomPublicId = async (
  env: Bindings,
  options: { excludePublicId?: string } = {},
) => {
  const db = getDb(env);
  const query = db.select({ publicId: profiles.publicId }).from(profiles);
  const [profile] = options.excludePublicId
    ? await query
        .where(ne(profiles.publicId, options.excludePublicId))
        .orderBy(sql`random()`)
        .limit(1)
    : await query.orderBy(sql`random()`).limit(1);

  return profile?.publicId ?? null;
};

const profileSelection = {
  publicId: profiles.publicId,
  name: profiles.name,
  icon: profiles.icon,
  ogp: profiles.ogp,
} as const;

export const userHasProfile = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.userId, userId));

  return profile !== undefined;
};

export const getUserProfile = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select(profileSelection)
    .from(profiles)
    .where(eq(profiles.userId, userId));

  return profile ?? null;
};

const musicSelection = {
  id: music.trackId,
  title: music.title,
  artist: music.artist,
  artworkUrl: music.artworkUrl,
  previewUrl: music.previewUrl,
  trackViewUrl: music.trackViewUrl,
} as const;

type MusicSelectionRow = {
  id: string | null;
  title: string | null;
  artist: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  trackViewUrl: string | null;
};

const toMusicTrack = (row: MusicSelectionRow): MusicTrack | null => {
  if (!row.id || !row.title || !row.artist) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artworkUrl: row.artworkUrl ?? null,
    previewUrl: row.previewUrl ?? null,
    trackViewUrl: row.trackViewUrl ?? null,
  };
};

export const getUserMusic = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  if (!(await userHasProfile(env, userId))) return null;

  const [track] = await db
    .select(musicSelection)
    .from(music)
    .where(eq(music.userId, userId))
    .orderBy(music.position)
    .limit(1);

  return { track: track ? toMusicTrack(track) : null };
};

export const getUserAlbum = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  if (!(await userHasProfile(env, userId))) return null;

  const photos = await db
    .select({
      imageId: albumPhotos.imageId,
      title: albumPhotos.title,
      subtitle: albumPhotos.subtitle,
    })
    .from(albumPhotos)
    .where(eq(albumPhotos.userId, userId))
    .orderBy(albumPhotos.position);

  return {
    photos: photos.map((photo) => ({
      ...photo,
      url: getImageUrl(photo.imageId)!,
    })),
  };
};

export const getImageOwners = async (env: Bindings, imageIds: readonly string[]) => {
  const uniqueImageIds = [...new Set(imageIds)];
  if (uniqueImageIds.length === 0) return new Map<string, string>();

  const db = getDb(env);
  const imageOwners = await db
    .select({ id: images.id, userId: images.userId })
    .from(images)
    .where(inArray(images.id, uniqueImageIds));

  return new Map(imageOwners.map((image) => [image.id, image.userId]));
};

export const deleteUserAccount = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const userImages = await db
    .select({ id: images.id })
    .from(images)
    .where(eq(images.userId, userId));
  const imageIds = userImages.map((image) => image.id);
  const deletedUsers = await db.transaction(async (tx) => {
    await tx.delete(albumPhotos).where(eq(albumPhotos.userId, userId));
    await tx.delete(music).where(eq(music.userId, userId));
    await tx.delete(profiles).where(eq(profiles.userId, userId));
    await tx.delete(images).where(eq(images.userId, userId));
    await tx.delete(accounts).where(eq(accounts.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));

    return tx.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
  });

  if (deletedUsers.length === 0) {
    return false;
  }

  await Promise.all(
    imageIds.map((imageId) => env.R2_BUCKET.delete(getUserImageObjectKey(userId, imageId))),
  );
  return true;
};

export const toAlbumPhotoRows = (userId: string, photos: readonly AlbumPhoto[]) =>
  photos.map((photo, index) => ({
    userId,
    imageId: photo.imageId,
    title: photo.title,
    subtitle: photo.subtitle,
    position: index,
  }));

export const toUserMusicRows = (userId: string, tracks: readonly MusicTrack[]) =>
  tracks.map((track, index) => ({
    userId,
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    previewUrl: track.previewUrl,
    trackViewUrl: track.trackViewUrl,
    position: index,
  }));

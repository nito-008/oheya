import { eq, inArray, sql } from "drizzle-orm";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { albumPhotos, images, profiles } from "~/lib/db/schema";
import type { AlbumPhoto } from "~/schema/album";
import { getImageUrl } from "~/schema/image";
import type { MusicTrack } from "~/schema/music";

export const getUserIdByPublicId = async (env: Bindings, publicId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.publicId, publicId));

  return profile?.userId ?? null;
};

export const getRandomPublicId = async (env: Bindings) => {
  const db = getDb(env);
  const [profile] = await db
    .select({ publicId: profiles.publicId })
    .from(profiles)
    .orderBy(sql`random()`)
    .limit(1);

  return profile?.publicId ?? null;
};

const profileSelection = {
  publicId: profiles.publicId,
  name: profiles.name,
  icon: profiles.icon,
} as const;

export const getUserProfile = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select(profileSelection)
    .from(profiles)
    .where(eq(profiles.userId, userId));

  return profile ?? null;
};

const musicSelection = {
  id: profiles.musicTrackId,
  title: profiles.musicTitle,
  artist: profiles.musicArtist,
  artworkUrl: profiles.musicArtworkUrl,
  previewUrl: profiles.musicPreviewUrl,
  trackViewUrl: profiles.musicTrackViewUrl,
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
  const [profile] = await db
    .select(musicSelection)
    .from(profiles)
    .where(eq(profiles.userId, userId));

  return profile ? { track: toMusicTrack(profile) } : null;
};

export const getUserAlbum = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (!profile) return null;

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

export const toAlbumPhotoRows = (userId: string, photos: readonly AlbumPhoto[]) =>
  photos.map((photo, index) => ({
    userId,
    imageId: photo.imageId,
    title: photo.title,
    subtitle: photo.subtitle,
    position: index,
  }));

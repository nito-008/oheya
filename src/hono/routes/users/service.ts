import { eq } from "drizzle-orm";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { profiles } from "~/lib/db/schema";
import type { MusicTrack } from "~/schema/music";

const profileSelection = {
  publicId: profiles.publicId,
  name: profiles.name,
  icon: profiles.icon,
} as const;

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

export const getUserIdByPublicId = async (env: Bindings, publicId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.publicId, publicId));

  return profile?.userId ?? null;
};

export const getUserProfile = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select(profileSelection)
    .from(profiles)
    .where(eq(profiles.userId, userId));

  return profile ?? null;
};

export const getUserMusic = async (env: Bindings, userId: string) => {
  const db = getDb(env);
  const [profile] = await db
    .select(musicSelection)
    .from(profiles)
    .where(eq(profiles.userId, userId));

  return profile ? { track: toMusicTrack(profile) } : null;
};

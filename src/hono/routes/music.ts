import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import * as v from "valibot";
import type { Bindings } from "~/hono/types";
import { getAppleMusicArtworkUrl } from "~/lib/music-artwork";
import type { MusicTrack } from "~/schema/music";

const musicSearchQuerySchema = v.object({
  term: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
});

type ITunesTrack = {
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
};

type ITunesSearchResponse = {
  results?: ITunesTrack[];
};

export const musicRouter = new Hono<{ Bindings: Bindings }>().get(
  "/search",
  vValidator("query", musicSearchQuerySchema),
  async (c) => {
    const { term } = c.req.valid("query");
    const params = new URLSearchParams({
      country: "jp",
      entity: "song",
      lang: "ja_jp",
      limit: "10",
      term,
    });

    const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!response.ok) {
      console.error("[music:search] iTunes API error", response.status, term);
      return c.json({ message: "Music search failed" } as const, 502);
    }

    const data = (await response.json()) as ITunesSearchResponse;
    const results: MusicTrack[] = (data.results ?? [])
      .filter((track) => track.trackId && track.trackName && track.artistName)
      .map((track) => ({
        id: String(track.trackId),
        title: track.trackName!,
        artist: track.artistName!,
        artworkUrl: getAppleMusicArtworkUrl(track.artworkUrl100, 600),
        previewUrl: track.previewUrl ?? null,
        trackViewUrl: track.trackViewUrl ?? null,
      }));

    return c.json({ results });
  },
);

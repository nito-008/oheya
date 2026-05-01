import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import * as v from "valibot";
import type { Bindings } from "~/hono/types";

const musicSearchQuerySchema = v.object({
  term: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
});

type ITunesTrack = {
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackId?: number;
  trackName?: string;
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
    const results = (data.results ?? [])
      .filter((track) => track.trackId && track.trackName && track.artistName)
      .map((track) => ({
        id: String(track.trackId),
        title: track.trackName!,
        artist: track.artistName!,
        artworkUrl:
          track.artworkUrl100?.replace("100x100bb", "300x300bb") ?? track.artworkUrl100 ?? null,
        previewUrl: track.previewUrl ?? null,
      }));

    return c.json({ results });
  },
);

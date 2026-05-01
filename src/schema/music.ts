import * as v from "valibot";

export const musicTrackSchema = v.object({
  id: v.pipe(v.string(), v.regex(/^\d+$/), v.maxLength(32)),
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
  artist: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
  artworkUrl: v.nullable(v.pipe(v.string(), v.url(), v.maxLength(2048))),
  previewUrl: v.nullable(v.pipe(v.string(), v.url(), v.maxLength(2048))),
  trackViewUrl: v.nullable(v.pipe(v.string(), v.url(), v.maxLength(2048))),
});

export const musicSelectionSchema = v.object({
  track: v.nullable(musicTrackSchema),
});

export type MusicTrack = v.InferOutput<typeof musicTrackSchema>;
export type MusicSelection = v.InferOutput<typeof musicSelectionSchema>;

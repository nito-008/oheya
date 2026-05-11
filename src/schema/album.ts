import * as v from "valibot";
import { imageIdPattern } from "~/schema/image";

export const maxAlbumPhotoCount = 6;
export const albumPhotoTitleMaxLength = 40;
export const albumPhotoSubtitleMaxLength = 80;

export const albumPhotoSchema = v.object({
  imageId: v.pipe(v.string(), v.regex(imageIdPattern)),
  title: v.pipe(v.string(), v.trim(), v.maxLength(albumPhotoTitleMaxLength)),
  subtitle: v.pipe(v.string(), v.trim(), v.maxLength(albumPhotoSubtitleMaxLength)),
});

export const albumSchema = v.object({
  photos: v.pipe(
    v.array(albumPhotoSchema),
    v.maxLength(maxAlbumPhotoCount),
    v.check(
      (photos) => new Set(photos.map((photo) => photo.imageId)).size === photos.length,
      "Album photo images must be unique",
    ),
  ),
});

export type AlbumPhoto = v.InferOutput<typeof albumPhotoSchema>;
export type Album = v.InferOutput<typeof albumSchema>;

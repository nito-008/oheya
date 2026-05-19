import { and, eq, inArray } from "drizzle-orm";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { albumPhotos, images, profiles } from "~/lib/db/schema";

export const getUserImageObjectKey = (userId: string, imageId: string) => `${userId}/${imageId}`;

export const applyR2HttpMetadata = (headers: Headers, metadata: R2HTTPMetadata | undefined) => {
  if (!metadata) return;
  if (metadata.contentType) headers.set("content-type", metadata.contentType);
  if (metadata.contentLanguage) headers.set("content-language", metadata.contentLanguage);
  if (metadata.contentDisposition) headers.set("content-disposition", metadata.contentDisposition);
  if (metadata.contentEncoding) headers.set("content-encoding", metadata.contentEncoding);
  if (metadata.cacheControl) headers.set("cache-control", metadata.cacheControl);
  if (metadata.cacheExpiry) headers.set("expires", metadata.cacheExpiry.toUTCString());
};

export const deleteOwnedImage = async (env: Bindings, imageId: string, userId: string) => {
  const db = getDb(env);
  const deletedImages = await db
    .delete(images)
    .where(and(eq(images.id, imageId), eq(images.userId, userId)))
    .returning({ id: images.id });
  if (deletedImages.length === 0) return false;

  await env.R2_BUCKET.delete(getUserImageObjectKey(userId, imageId));
  return true;
};

export const deleteUnusedUserImages = async (
  env: Bindings,
  userId: string,
  imageIds: readonly string[],
) => {
  const uniqueImageIds = [...new Set(imageIds)];
  if (uniqueImageIds.length === 0) return;

  const db = getDb(env);
  const [profile] = await db
    .select({ icon: profiles.icon, ogp: profiles.ogp })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  const remainingAlbumPhotos = await db
    .select({ imageId: albumPhotos.imageId })
    .from(albumPhotos)
    .where(and(eq(albumPhotos.userId, userId), inArray(albumPhotos.imageId, uniqueImageIds)));

  const retainedImageIds = new Set([
    ...(profile?.icon ? [profile.icon] : []),
    ...(profile?.ogp ? [profile.ogp] : []),
    ...remainingAlbumPhotos.map((photo) => photo.imageId),
  ]);

  await Promise.all(
    uniqueImageIds
      .filter((imageId) => !retainedImageIds.has(imageId))
      .map((imageId) => deleteOwnedImage(env, imageId, userId)),
  );
};

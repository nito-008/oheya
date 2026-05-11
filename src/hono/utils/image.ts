import { and, eq } from "drizzle-orm";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { images } from "~/lib/db/schema";

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

  await env.R2_BUCKET.delete(imageId);
  return true;
};

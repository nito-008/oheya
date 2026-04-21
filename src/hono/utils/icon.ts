const contentTypeToExtension = {
  "image/png": "png",
  "image/webp": "webp",
} as const;
const inlineImagePattern = /^data:(image\/(?:png|webp));base64,([A-Za-z0-9+/=]+)$/;
const iconUrlPattern = /^\/api\/users\/[A-Za-z0-9_]+\/icon(?:\?v=[A-Fa-f0-9]+)?$/;

const getIconVersion = (iconObjectKey: string) => {
  const match = iconObjectKey.match(/\/icon-([A-Fa-f0-9]+)\.[^.]+$/);
  return match?.[1] ?? null;
};

export const getIconUrl = (publicId: string, iconObjectKey: string | null) => {
  if (!iconObjectKey) return null;

  const version = getIconVersion(iconObjectKey);
  return version ? `/api/users/${publicId}/icon?v=${version}` : `/api/users/${publicId}/icon`;
};

export const isExistingIconUrl = (value: string) => iconUrlPattern.test(value);

export const isInlineIconImage = (value: string) => inlineImagePattern.test(value);

export const applyR2HttpMetadata = (headers: Headers, metadata: R2HTTPMetadata | undefined) => {
  if (!metadata) return;
  if (metadata.contentType) headers.set("content-type", metadata.contentType);
  if (metadata.contentLanguage) headers.set("content-language", metadata.contentLanguage);
  if (metadata.contentDisposition) headers.set("content-disposition", metadata.contentDisposition);
  if (metadata.contentEncoding) headers.set("content-encoding", metadata.contentEncoding);
  if (metadata.cacheControl) headers.set("cache-control", metadata.cacheControl);
  if (metadata.cacheExpiry) headers.set("expires", metadata.cacheExpiry.toUTCString());
};

const decodeBase64 = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const getSha256Hex = async (bytes: Uint8Array<ArrayBuffer>) => {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const uploadIcon = async (bucket: R2Bucket, userId: string, inlineImage: string) => {
  const match = inlineImage.match(inlineImagePattern);
  if (!match) return null;

  const [, contentType, base64] = match;
  const bytes = decodeBase64(base64);
  const digest = await getSha256Hex(bytes);
  const extension = contentTypeToExtension[contentType as keyof typeof contentTypeToExtension];
  const key = `profiles/${userId}/icon-${digest}.${extension}`;

  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType,
    },
  });

  return key;
};

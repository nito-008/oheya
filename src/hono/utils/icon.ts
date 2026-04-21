const inlineImagePattern = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;
const iconUrlPattern = /^\/api\/users\/[A-Za-z0-9_]+\/icon$/;

const contentTypeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const getIconUrl = (publicId: string, iconObjectKey: string | null) =>
  iconObjectKey ? `/api/users/${publicId}/icon` : null;

export const isExistingIconUrl = (value: string) => iconUrlPattern.test(value);

export const isInlineIconImage = (value: string) => inlineImagePattern.test(value);

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

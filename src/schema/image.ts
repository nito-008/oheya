const imageContentTypes = ["image/jpeg", "image/webp"] as const;

export const maxImageSizeBytes = 1 * 1024 * 1024;
export const maxUserImageStorageBytes = 50 * 1024 * 1024;

export const isImageContentType = (value: string): value is (typeof imageContentTypes)[number] =>
  imageContentTypes.some((contentType) => contentType === value);

export const imageIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getImageUrl = (imageId: string | null) => (imageId ? `/api/images/${imageId}` : null);

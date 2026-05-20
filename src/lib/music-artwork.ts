const appleArtworkSizePattern = /\/\d+x\d+bb(?=\.[a-z]+(?:\?|$))/i;

export const APPLE_MUSIC_ARTWORK_SIZE = 600;

export const getAppleMusicArtworkUrl = (url: string | null | undefined, size: number) =>
  url?.replace(appleArtworkSizePattern, `/${size}x${size}bb`) ?? null;

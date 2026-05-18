export const webpContentType = "image/webp";
export const webpExtension = "webp";
export const jpegContentType = "image/jpeg";
export const jpegExtension = "jpeg";

const QUALITY_SCALE = 100;

type WebpEncoder = (data: ImageData, options?: { quality?: number }) => Promise<ArrayBuffer>;
type CanvasImageBlob = {
  blob: Blob;
  contentType: typeof webpContentType | typeof jpegContentType;
  extension: typeof webpExtension | typeof jpegExtension;
};

let webpEncoderPromise: Promise<WebpEncoder> | null = null;
let supportsNativeWebp: boolean | null = null;

const loadWebpEncoder = async () => {
  webpEncoderPromise ??= import("@jsquash/webp/encode").then((module) => module.default);
  return await webpEncoderPromise;
};

const canvasToBlob = (canvas: HTMLCanvasElement, contentType: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, contentType, quality));

const canvasSupportsNativeWebp = () => {
  supportsNativeWebp ??= (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(webpContentType).startsWith(`data:${webpContentType}`);
  })();

  return supportsNativeWebp;
};

export const canvasToWebpBlob = async (canvas: HTMLCanvasElement, quality: number) => {
  if (canvasSupportsNativeWebp()) {
    const nativeBlob = await canvasToBlob(canvas, webpContentType, quality);
    if (nativeBlob?.type === webpContentType && nativeBlob.size > 0) return nativeBlob;
  }

  const context = canvas.getContext("2d");
  if (!context) return null;

  const encode = await loadWebpEncoder();
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const webpBuffer = await encode(imageData, {
    quality: Math.round(quality * QUALITY_SCALE),
  });

  return new Blob([webpBuffer], { type: webpContentType });
};

export const canvasToImageBlob = async (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<CanvasImageBlob | null> => {
  try {
    const webpBlob = await canvasToWebpBlob(canvas, quality);
    if (webpBlob) {
      return { blob: webpBlob, contentType: webpContentType, extension: webpExtension };
    }
  } catch {
    // Keep the native canvas JPEG fallback available when wasm WebP cannot load or encode.
  }

  const jpegBlob = await canvasToBlob(canvas, jpegContentType, quality);
  if (jpegBlob?.type === jpegContentType && jpegBlob.size > 0) {
    return { blob: jpegBlob, contentType: jpegContentType, extension: jpegExtension };
  }

  return null;
};

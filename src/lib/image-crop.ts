type CropLayoutInput = {
  imageNaturalHeight: number;
  imageNaturalWidth: number;
  positionX: number;
  positionY: number;
  viewHeight: number;
  viewWidth: number;
  zoom: number;
};

type ZoomCropInput = CropLayoutInput & {
  maxZoom: number;
  minZoom: number;
  targetZoom: number;
  zoomPointX: number;
  zoomPointY: number;
};

export type CropLayout = {
  imageHeight: number;
  imageWidth: number;
  maxPositionX: number;
  maxPositionY: number;
};

export type CropTransform = CropLayout & {
  positionX: number;
  positionY: number;
  zoom: number;
};

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const getCropLayout = ({
  imageNaturalHeight,
  imageNaturalWidth,
  positionX,
  positionY,
  viewHeight,
  viewWidth,
  zoom,
}: CropLayoutInput): CropTransform => {
  const coverScale = Math.max(viewWidth / imageNaturalWidth, viewHeight / imageNaturalHeight);
  const imageWidth = imageNaturalWidth * coverScale * zoom;
  const imageHeight = imageNaturalHeight * coverScale * zoom;
  const maxPositionX = Math.max(0, (imageWidth - viewWidth) / 2);
  const maxPositionY = Math.max(0, (imageHeight - viewHeight) / 2);

  return {
    imageHeight,
    imageWidth,
    maxPositionX,
    maxPositionY,
    positionX: clamp(positionX, -maxPositionX, maxPositionX),
    positionY: clamp(positionY, -maxPositionY, maxPositionY),
    zoom,
  };
};

export const zoomCropAtPoint = ({
  imageNaturalHeight,
  imageNaturalWidth,
  maxZoom,
  minZoom,
  positionX,
  positionY,
  targetZoom,
  viewHeight,
  viewWidth,
  zoom,
  zoomPointX,
  zoomPointY,
}: ZoomCropInput): CropTransform => {
  const nextZoom = clamp(targetZoom, minZoom, maxZoom);
  const oldLayout = getCropLayout({
    imageNaturalHeight,
    imageNaturalWidth,
    positionX,
    positionY,
    viewHeight,
    viewWidth,
    zoom,
  });

  if (nextZoom === oldLayout.zoom) return oldLayout;

  const oldImageLeft = (viewWidth - oldLayout.imageWidth) / 2 + oldLayout.positionX;
  const oldImageTop = (viewHeight - oldLayout.imageHeight) / 2 + oldLayout.positionY;
  const imagePointX = (zoomPointX - oldImageLeft) / oldLayout.imageWidth;
  const imagePointY = (zoomPointY - oldImageTop) / oldLayout.imageHeight;
  const nextLayout = getCropLayout({
    imageNaturalHeight,
    imageNaturalWidth,
    positionX,
    positionY,
    viewHeight,
    viewWidth,
    zoom: nextZoom,
  });

  return {
    ...nextLayout,
    positionX: clamp(
      zoomPointX - imagePointX * nextLayout.imageWidth - (viewWidth - nextLayout.imageWidth) / 2,
      -nextLayout.maxPositionX,
      nextLayout.maxPositionX,
    ),
    positionY: clamp(
      zoomPointY - imagePointY * nextLayout.imageHeight - (viewHeight - nextLayout.imageHeight) / 2,
      -nextLayout.maxPositionY,
      nextLayout.maxPositionY,
    ),
  };
};

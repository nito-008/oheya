import type { QRL } from "@builder.io/qwik";
import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { FieldElement, FieldEvent } from "@modular-forms/qwik";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import { Modal } from "~/components/ui/modal/modal";
import { TapClickIcon } from "~/components/ui/tap-click-icon/tap-click-icon";
import { canvasToImageBlob } from "~/lib/canvas-image";
import { clamp, getCropLayout, zoomCropAtPoint } from "~/lib/image-crop";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import { getImageUrl, maxImageSourceSizeBytes } from "~/schema/image";
import styles from "./icon-crop-input.module.css";

const OUTPUT_SIZE = 256;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ICON_QUALITY = 0.86;
const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/avif";
const WHEEL_ZOOM_STEP = 0.12;

type FieldProps = {
  name: string;
  autoFocus: boolean;
  ref: QRL<(element: FieldElement) => void>;
  onInput$: QRL<(event: FieldEvent, element: FieldElement) => void>;
  onChange$: QRL<(event: FieldEvent, element: FieldElement) => void>;
  onBlur$: QRL<(event: FieldEvent, element: FieldElement) => void>;
};

type FieldState = {
  value?: string | null;
  error?: string;
};

type IconCropInputProps = {
  field: FieldState;
  fieldProps: FieldProps;
  label: string;
  onApply$?: QRL<(file: File) => Promise<string>>;
};

type CropDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPositionX: number;
  startPositionY: number;
};

type CropPointer = {
  clientX: number;
  clientY: number;
  pointerId: number;
};

type CropPinchState = {
  startCenterX: number;
  startCenterY: number;
  startDistance: number;
  startPositionX: number;
  startPositionY: number;
  startZoom: number;
};

type CropLayout = {
  viewSize: number;
  imageWidth: number;
  imageHeight: number;
  maxPositionX: number;
  maxPositionY: number;
};

const getPointerDistance = (first: CropPointer, second: CropPointer) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

const getPointerCenter = (first: CropPointer, second: CropPointer) => ({
  clientX: (first.clientX + second.clientX) / 2,
  clientY: (first.clientY + second.clientY) / 2,
});

export const IconCropInput = component$<IconCropInputProps>((props) => {
  const { field, fieldProps, label, onApply$ } = props;
  const sourceImageUrl = useSignal("");
  const icon = useSignal(field.value ?? "");
  const previewImageUrl = useSignal(getImageUrl(icon.value) ?? "");
  const hiddenIconInputRef = useSignal<HTMLInputElement>();
  const sourceImageRef = useSignal<HTMLImageElement>();
  const cropBoxRef = useSignal<HTMLDivElement>();
  const hiddenImageInputRef = useSignal<HTMLInputElement>();
  const localError = useSignal("");
  const cropModalOpen = useSignal(false);
  const cropImageReady = useSignal(false);
  const isApplying = useSignal(false);
  const cropZoom = useSignal(MIN_SCALE);
  const cropPositionX = useSignal(0);
  const cropPositionY = useSignal(0);
  const cropImageWidth = useSignal(OUTPUT_SIZE);
  const cropImageHeight = useSignal(OUTPUT_SIZE);
  const cropDrag = useSignal<CropDragState | null>(null);
  const cropPointers = useSignal<CropPointer[]>([]);
  const cropPinch = useSignal<CropPinchState | null>(null);

  const readFileAsDataUrl = $((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  });

  const updateCropLayout = $((): CropLayout | null => {
    const image = sourceImageRef.value;
    const cropBox = cropBoxRef.value;
    if (!image || !cropBox || !image.naturalWidth || !image.naturalHeight) return null;

    const cropRect = cropBox.getBoundingClientRect();
    const viewSize = cropRect.width || OUTPUT_SIZE;
    const layout = getCropLayout({
      imageNaturalHeight: image.naturalHeight,
      imageNaturalWidth: image.naturalWidth,
      positionX: cropPositionX.value,
      positionY: cropPositionY.value,
      viewHeight: viewSize,
      viewWidth: viewSize,
      zoom: cropZoom.value,
    });

    cropImageWidth.value = layout.imageWidth;
    cropImageHeight.value = layout.imageHeight;
    cropPositionX.value = layout.positionX;
    cropPositionY.value = layout.positionY;

    return {
      viewSize,
      imageWidth: layout.imageWidth,
      imageHeight: layout.imageHeight,
      maxPositionX: layout.maxPositionX,
      maxPositionY: layout.maxPositionY,
    };
  });

  const drawCrop = $(async () => {
    const image = sourceImageRef.value;
    const cropBox = cropBoxRef.value;
    if (!image || !cropBox || !image.naturalWidth || !image.naturalHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return;

    const cropRect = cropBox.getBoundingClientRect();
    const viewSize = cropRect.width || OUTPUT_SIZE;
    const viewToOutput = OUTPUT_SIZE / viewSize;
    const drawScale =
      Math.max(viewSize / image.naturalWidth, viewSize / image.naturalHeight) *
      cropZoom.value *
      viewToOutput;
    const drawWidth = image.naturalWidth * drawScale;
    const drawHeight = image.naturalHeight * drawScale;
    const drawX = (OUTPUT_SIZE - drawWidth) / 2 + cropPositionX.value * viewToOutput;
    const drawY = (OUTPUT_SIZE - drawHeight) / 2 + cropPositionY.value * viewToOutput;

    context.fillStyle = "#fffef8";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const output = await canvasToImageBlob(canvas, ICON_QUALITY);
    if (!output) {
      localError.value = "このブラウザはアイコン画像の保存形式に対応していません";
      return null;
    }

    localError.value = "";
    return new File([output.blob], `icon.${output.extension}`, { type: output.contentType });
  });

  const resetCrop = $(async () => {
    cropZoom.value = MIN_SCALE;
    cropPositionX.value = 0;
    cropPositionY.value = 0;
    await updateCropLayout();
  });

  const closeCropModal = $(() => {
    cropModalOpen.value = false;
    sourceImageUrl.value = "";
    cropImageReady.value = false;
    cropDrag.value = null;
    cropPointers.value = [];
    cropPinch.value = null;
  });

  const updateIconValue = $(async (imageId: string) => {
    icon.value = imageId;

    const hiddenIconInput = hiddenIconInputRef.value;
    if (!hiddenIconInput) return;

    hiddenIconInput.value = imageId;
    hiddenIconInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    hiddenIconInput.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const clearHiddenImageFile = $(() => {
    if (hiddenImageInputRef.value) {
      hiddenImageInputRef.value.value = "";
    }
  });

  const applyCrop = $(async () => {
    if (isApplying.value) return;

    const croppedIcon = await drawCrop();
    if (croppedIcon) {
      const previousPreviewImageUrl = previewImageUrl.value;
      const nextPreviewImageUrl = URL.createObjectURL(croppedIcon);
      if (previewImageUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl.value);
      }
      previewImageUrl.value = nextPreviewImageUrl;

      if (hiddenImageInputRef.value) {
        const files = new DataTransfer();
        files.items.add(croppedIcon);
        hiddenImageInputRef.value.files = files.files;
      }

      if (onApply$) {
        isApplying.value = true;
        try {
          const imageId = await onApply$(croppedIcon);
          await updateIconValue(imageId);
          await clearHiddenImageFile();
        } catch (error) {
          await clearHiddenImageFile();
          URL.revokeObjectURL(nextPreviewImageUrl);
          previewImageUrl.value = previousPreviewImageUrl;
          localError.value =
            error instanceof Error ? error.message : "アイコンの保存に失敗しました";
        } finally {
          isApplying.value = false;
        }
      }
    }
    await closeCropModal();
  });

  const handleSourceFileChange = $(async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    localError.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      localError.value = "画像ファイルを選んでください";
      input.value = "";
      return;
    }

    if (file.size > maxImageSourceSizeBytes) {
      localError.value = "20MB以下の画像を選んでください";
      input.value = "";
      return;
    }

    try {
      sourceImageUrl.value = await readFileAsDataUrl(file);
      cropImageReady.value = false;
      cropDrag.value = null;
      cropPointers.value = [];
      cropPinch.value = null;
      cropModalOpen.value = true;
      input.value = "";
    } catch {
      localError.value = "画像を読み込めませんでした";
      input.value = "";
    }
  });

  const handleCropPointerDown = $((event: PointerEvent, element: Element) => {
    if (!sourceImageRef.value || (event.pointerType === "mouse" && event.button !== 0)) return;

    const cropBox = element as HTMLDivElement;
    cropBox.setPointerCapture(event.pointerId);
    const nextPointers = [
      ...cropPointers.value.filter((pointer) => pointer.pointerId !== event.pointerId),
      { clientX: event.clientX, clientY: event.clientY, pointerId: event.pointerId },
    ];
    cropPointers.value = nextPointers;

    if (nextPointers.length >= 2) {
      const [firstPointer, secondPointer] = nextPointers;
      const center = getPointerCenter(firstPointer, secondPointer);
      const cropRect = cropBox.getBoundingClientRect();
      cropPinch.value = {
        startCenterX: center.clientX - cropRect.left,
        startCenterY: center.clientY - cropRect.top,
        startDistance: getPointerDistance(firstPointer, secondPointer),
        startPositionX: cropPositionX.value,
        startPositionY: cropPositionY.value,
        startZoom: cropZoom.value,
      };
      cropDrag.value = null;
      return;
    }

    cropPinch.value = null;
    cropDrag.value = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: cropPositionX.value,
      startPositionY: cropPositionY.value,
    };
  });

  const handleCropPointerMove = $(async (event: PointerEvent) => {
    const pointerIndex = cropPointers.value.findIndex(
      (pointer) => pointer.pointerId === event.pointerId,
    );
    if (pointerIndex !== -1) {
      const nextPointers = [...cropPointers.value];
      nextPointers[pointerIndex] = {
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
      };
      cropPointers.value = nextPointers;
    }

    if (cropPointers.value.length >= 2 && cropPinch.value) {
      const image = sourceImageRef.value;
      const cropBox = cropBoxRef.value;
      if (!image || !cropBox || !image.naturalWidth || !image.naturalHeight) return;

      const [firstPointer, secondPointer] = cropPointers.value;
      const cropRect = cropBox.getBoundingClientRect();
      const viewSize = cropRect.width || OUTPUT_SIZE;
      const center = getPointerCenter(firstPointer, secondPointer);
      const currentCenterX = center.clientX - cropRect.left;
      const currentCenterY = center.clientY - cropRect.top;
      const pinch = cropPinch.value;
      const distance = getPointerDistance(firstPointer, secondPointer);
      if (pinch.startDistance <= 0 || distance <= 0) return;

      const targetZoom = pinch.startZoom * (distance / pinch.startDistance);
      const transform = zoomCropAtPoint({
        imageNaturalHeight: image.naturalHeight,
        imageNaturalWidth: image.naturalWidth,
        maxZoom: MAX_SCALE,
        minZoom: MIN_SCALE,
        positionX: pinch.startPositionX,
        positionY: pinch.startPositionY,
        targetZoom,
        viewHeight: viewSize,
        viewWidth: viewSize,
        zoom: pinch.startZoom,
        zoomPointX: pinch.startCenterX,
        zoomPointY: pinch.startCenterY,
      });

      cropZoom.value = transform.zoom;
      cropPositionX.value = clamp(
        transform.positionX + currentCenterX - pinch.startCenterX,
        -transform.maxPositionX,
        transform.maxPositionX,
      );
      cropPositionY.value = clamp(
        transform.positionY + currentCenterY - pinch.startCenterY,
        -transform.maxPositionY,
        transform.maxPositionY,
      );
      await updateCropLayout();
      return;
    }

    const drag = cropDrag.value;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const layout = await updateCropLayout();
    if (!layout) return;

    cropPositionX.value = clamp(
      drag.startPositionX + event.clientX - drag.startClientX,
      -layout.maxPositionX,
      layout.maxPositionX,
    );
    cropPositionY.value = clamp(
      drag.startPositionY + event.clientY - drag.startClientY,
      -layout.maxPositionY,
      layout.maxPositionY,
    );
  });

  const handleCropPointerEnd = $((event: PointerEvent, element: Element) => {
    const cropBox = element as HTMLDivElement;
    if (cropBox.hasPointerCapture(event.pointerId)) {
      cropBox.releasePointerCapture(event.pointerId);
    }

    const nextPointers = cropPointers.value.filter(
      (pointer) => pointer.pointerId !== event.pointerId,
    );
    cropPointers.value = nextPointers;
    cropPinch.value = null;

    if (nextPointers.length === 1) {
      const [pointer] = nextPointers;
      cropDrag.value = {
        pointerId: pointer.pointerId,
        startClientX: pointer.clientX,
        startClientY: pointer.clientY,
        startPositionX: cropPositionX.value,
        startPositionY: cropPositionY.value,
      };
      return;
    }

    if (cropDrag.value?.pointerId === event.pointerId || nextPointers.length === 0) {
      cropDrag.value = null;
    }
  });

  const handleCropWheel = $(async (event: WheelEvent) => {
    const image = sourceImageRef.value;
    const cropBox = cropBoxRef.value;
    if (!image || !cropBox || !image.naturalWidth || !image.naturalHeight) return;

    const cropRect = cropBox.getBoundingClientRect();
    const viewSize = cropRect.width || OUTPUT_SIZE;
    const oldZoom = cropZoom.value;
    const newZoom = clamp(
      oldZoom * (event.deltaY < 0 ? 1 + WHEEL_ZOOM_STEP : 1 - WHEEL_ZOOM_STEP),
      MIN_SCALE,
      MAX_SCALE,
    );
    if (newZoom === oldZoom) return;

    const transform = zoomCropAtPoint({
      imageNaturalHeight: image.naturalHeight,
      imageNaturalWidth: image.naturalWidth,
      maxZoom: MAX_SCALE,
      minZoom: MIN_SCALE,
      positionX: cropPositionX.value,
      positionY: cropPositionY.value,
      targetZoom: newZoom,
      viewHeight: viewSize,
      viewWidth: viewSize,
      zoom: oldZoom,
      zoomPointX: event.clientX - cropRect.left,
      zoomPointY: event.clientY - cropRect.top,
    });

    cropZoom.value = transform.zoom;
    cropPositionX.value = transform.positionX;
    cropPositionY.value = transform.positionY;
    await updateCropLayout();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => cropModalOpen.value);
    track(() => sourceImageUrl.value);
    await updateCropLayout();
  });

  return (
    <div class={styles.field}>
      <span class={styles.label}>{label}</span>
      <input
        {...fieldProps}
        ref={async (element) => {
          hiddenIconInputRef.value = element as HTMLInputElement;
          await fieldProps.ref(element);
        }}
        type="hidden"
        value={icon.value}
      />
      <input ref={hiddenImageInputRef} type="file" name="iconImage" hidden />
      <div class={styles.editor}>
        <div class={styles.cropBoxFrame}>
          <div class={styles.cropBox}>
            {previewImageUrl.value ? (
              <img
                class={styles.previewImage}
                src={previewImageUrl.value}
                alt=""
                width={OUTPUT_SIZE}
                height={OUTPUT_SIZE}
              />
            ) : (
              <span class={styles.placeholderSurface} aria-hidden="true">
                <img
                  src={iconPlaceholderSvg}
                  alt=""
                  width={64}
                  height={64}
                  class={styles.placeholderImage}
                />
              </span>
            )}
            <span class={styles.mask} aria-hidden="true" />
            <label class={styles.fileOverlay} aria-label="画像を選ぶ">
              <span aria-hidden="true">+</span>
              <input type="file" accept={IMAGE_ACCEPT} onChange$={handleSourceFileChange} />
            </label>
          </div>
          <TapClickIcon class={styles.clickCue} />
        </div>
      </div>
      <FormErrorMessage message={field.error || localError.value} />
      <Modal open={cropModalOpen.value} title="アイコンを調整" onClose$={closeCropModal}>
        <div class={styles.modalEditor}>
          <div
            ref={cropBoxRef}
            class={[styles.cropBox, styles.modalCropBox]}
            preventdefault:touchmove
            preventdefault:touchstart
            preventdefault:wheel
            onPointerDown$={handleCropPointerDown}
            onPointerMove$={handleCropPointerMove}
            onPointerUp$={handleCropPointerEnd}
            onPointerCancel$={handleCropPointerEnd}
            onWheel$={handleCropWheel}
          >
            {sourceImageUrl.value ? (
              <img
                ref={sourceImageRef}
                class={styles.sourceImage}
                src={sourceImageUrl.value}
                alt=""
                width={OUTPUT_SIZE}
                height={OUTPUT_SIZE}
                draggable={false}
                style={{
                  height: `${cropImageHeight.value}px`,
                  transform: `translate(calc(-50% + ${cropPositionX.value}px), calc(-50% + ${cropPositionY.value}px))`,
                  width: `${cropImageWidth.value}px`,
                }}
                onLoad$={async () => {
                  cropImageReady.value = true;
                  await resetCrop();
                }}
              />
            ) : null}
            {sourceImageUrl.value && <span class={styles.guides} aria-hidden="true" />}
            <span class={styles.mask} aria-hidden="true" />
          </div>
          <div class={styles.modalActions}>
            <FormButton type="button" variant="secondary" onClick$={closeCropModal}>
              キャンセル
            </FormButton>
            <FormButton
              type="button"
              variant="primary"
              disabled={!cropImageReady.value || isApplying.value}
              aria-busy={isApplying.value}
              onClick$={applyCrop}
            >
              {isApplying.value ? "保存中..." : "保存する"}
            </FormButton>
          </div>
        </div>
      </Modal>
    </div>
  );
});

import type { QRL } from "@builder.io/qwik";
import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { FieldElement, FieldEvent } from "@modular-forms/qwik";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import { Modal } from "~/components/ui/modal/modal";
import { TapClickIcon } from "~/components/ui/tap-click-icon/tap-click-icon";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import { getImageUrl } from "~/schema/image";
import styles from "./icon-crop-input.module.css";

const OUTPUT_SIZE = 256;
const MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ICON_CONTENT_TYPE = "image/webp";
const ICON_QUALITY = 0.86;
const FALLBACK_ICON_CONTENT_TYPE = "image/png";
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
};

type CropDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPositionX: number;
  startPositionY: number;
};

type CropLayout = {
  viewSize: number;
  imageWidth: number;
  imageHeight: number;
  maxPositionX: number;
  maxPositionY: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const IconCropInput = component$<IconCropInputProps>(({ field, fieldProps, label }) => {
  const sourceImageUrl = useSignal("");
  const icon = useSignal(field.value ?? "");
  const previewImageUrl = useSignal(getImageUrl(icon.value) ?? "");
  const sourceImageRef = useSignal<HTMLImageElement>();
  const cropBoxRef = useSignal<HTMLDivElement>();
  const hiddenImageInputRef = useSignal<HTMLInputElement>();
  const localError = useSignal("");
  const cropModalOpen = useSignal(false);
  const cropImageReady = useSignal(false);
  const cropZoom = useSignal(MIN_SCALE);
  const cropPositionX = useSignal(0);
  const cropPositionY = useSignal(0);
  const cropImageWidth = useSignal(OUTPUT_SIZE);
  const cropImageHeight = useSignal(OUTPUT_SIZE);
  const cropDrag = useSignal<CropDragState | null>(null);

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
    const coverScale =
      Math.max(viewSize / image.naturalWidth, viewSize / image.naturalHeight) * cropZoom.value;
    const imageWidth = image.naturalWidth * coverScale;
    const imageHeight = image.naturalHeight * coverScale;
    const maxPositionX = Math.max(0, (imageWidth - viewSize) / 2);
    const maxPositionY = Math.max(0, (imageHeight - viewSize) / 2);

    cropImageWidth.value = imageWidth;
    cropImageHeight.value = imageHeight;
    cropPositionX.value = clamp(cropPositionX.value, -maxPositionX, maxPositionX);
    cropPositionY.value = clamp(cropPositionY.value, -maxPositionY, maxPositionY);

    return { viewSize, imageWidth, imageHeight, maxPositionX, maxPositionY };
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

    const toBlob = (contentType: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, contentType, ICON_QUALITY));

    let blob = await toBlob(ICON_CONTENT_TYPE);
    if (blob && blob.type !== ICON_CONTENT_TYPE && blob.type !== FALLBACK_ICON_CONTENT_TYPE) {
      blob = await toBlob(FALLBACK_ICON_CONTENT_TYPE);
    }

    if (!blob || (blob.type !== ICON_CONTENT_TYPE && blob.type !== FALLBACK_ICON_CONTENT_TYPE)) {
      localError.value = "このブラウザはアイコン画像の保存形式に対応していません";
      return null;
    }

    localError.value = "";
    const extension = blob.type === FALLBACK_ICON_CONTENT_TYPE ? "png" : "webp";
    return new File([blob], `icon.${extension}`, { type: blob.type });
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
  });

  const applyCrop = $(async () => {
    const croppedIcon = await drawCrop();
    if (croppedIcon) {
      if (previewImageUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl.value);
      }
      previewImageUrl.value = URL.createObjectURL(croppedIcon);

      if (hiddenImageInputRef.value) {
        const files = new DataTransfer();
        files.items.add(croppedIcon);
        hiddenImageInputRef.value.files = files.files;
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

    if (file.size > MAX_SOURCE_SIZE) {
      localError.value = "6MB以下の画像を選んでください";
      input.value = "";
      return;
    }

    try {
      sourceImageUrl.value = await readFileAsDataUrl(file);
      cropImageReady.value = false;
      cropDrag.value = null;
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
    cropDrag.value = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: cropPositionX.value,
      startPositionY: cropPositionY.value,
    };
  });

  const handleCropPointerMove = $(async (event: PointerEvent) => {
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
    if (cropDrag.value?.pointerId !== event.pointerId) return;

    const cropBox = element as HTMLDivElement;
    if (cropBox.hasPointerCapture(event.pointerId)) {
      cropBox.releasePointerCapture(event.pointerId);
    }
    cropDrag.value = null;
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

    const coverScale = Math.max(viewSize / image.naturalWidth, viewSize / image.naturalHeight);
    const oldImageWidth = image.naturalWidth * coverScale * oldZoom;
    const oldImageHeight = image.naturalHeight * coverScale * oldZoom;
    const newImageWidth = image.naturalWidth * coverScale * newZoom;
    const newImageHeight = image.naturalHeight * coverScale * newZoom;
    const oldImageLeft = (viewSize - oldImageWidth) / 2 + cropPositionX.value;
    const oldImageTop = (viewSize - oldImageHeight) / 2 + cropPositionY.value;
    const zoomPointX = event.clientX - cropRect.left;
    const zoomPointY = event.clientY - cropRect.top;
    const imagePointX = (zoomPointX - oldImageLeft) / oldImageWidth;
    const imagePointY = (zoomPointY - oldImageTop) / oldImageHeight;
    const maxPositionX = Math.max(0, (newImageWidth - viewSize) / 2);
    const maxPositionY = Math.max(0, (newImageHeight - viewSize) / 2);

    cropZoom.value = newZoom;
    cropPositionX.value = clamp(
      zoomPointX - imagePointX * newImageWidth - (viewSize - newImageWidth) / 2,
      -maxPositionX,
      maxPositionX,
    );
    cropPositionY.value = clamp(
      zoomPointY - imagePointY * newImageHeight - (viewSize - newImageHeight) / 2,
      -maxPositionY,
      maxPositionY,
    );
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
              <img
                class={styles.placeholderImage}
                src={iconPlaceholderSvg}
                alt=""
                width={64}
                height={64}
              />
            )}
            <span class={styles.mask} aria-hidden="true" />
            <label class={styles.fileOverlay} aria-label="画像を選ぶ">
              <span aria-hidden="true">+</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange$={handleSourceFileChange}
              />
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
              disabled={!cropImageReady.value}
              onClick$={applyCrop}
            >
              これにする
            </FormButton>
          </div>
        </div>
      </Modal>
    </div>
  );
});

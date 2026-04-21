import type { QRL } from "@builder.io/qwik";
import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { FieldElement, FieldEvent } from "@modular-forms/qwik";
import { useZoomImageWheel } from "@zoom-image/qwik";
import { Button } from "~/components/ui/button/button";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { Modal } from "~/components/ui/modal/modal";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import styles from "./avatar-crop-input.module.css";

const OUTPUT_SIZE = 256;
const MAX_SOURCE_SIZE = 6 * 1024 * 1024;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ICON_CONTENT_TYPE = "image/webp";
const ICON_QUALITY = 0.86;
const FALLBACK_ICON_CONTENT_TYPE = "image/png";

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

type AvatarCropInputProps = {
  field: FieldState;
  fieldProps: FieldProps;
  label: string;
};

export const AvatarCropInput = component$<AvatarCropInputProps>(({ field, fieldProps, label }) => {
  const sourceImageUrl = useSignal("");
  const iconUrl = useSignal(field.value ?? "");
  const draftIconUrl = useSignal("");
  const sourceImageRef = useSignal<HTMLImageElement>();
  const cropBoxRef = useSignal<HTMLDivElement>();
  const hiddenInputRef = useSignal<HTMLInputElement>();
  const localError = useSignal("");
  const zoomReady = useSignal(false);
  const cropModalOpen = useSignal(false);
  const { createZoomImage, setZoomImageState, zoomImageState } = useZoomImageWheel();

  const updateIconUrl = $(async (value: string) => {
    iconUrl.value = value;
    if (hiddenInputRef.value) {
      hiddenInputRef.value.value = value;
      await fieldProps.onInput$(new Event("input"), hiddenInputRef.value);
    }
  });

  const drawCrop = $(() => {
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
    const baseScale = Math.max(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight);
    const drawScale = baseScale * zoomImageState.currentZoom;
    const drawWidth = image.naturalWidth * drawScale;
    const drawHeight = image.naturalHeight * drawScale;
    const drawX =
      ((OUTPUT_SIZE - image.naturalWidth * baseScale) / 2) * zoomImageState.currentZoom +
      zoomImageState.currentPositionX * viewToOutput;
    const drawY =
      ((OUTPUT_SIZE - image.naturalHeight * baseScale) / 2) * zoomImageState.currentZoom +
      zoomImageState.currentPositionY * viewToOutput;

    context.fillStyle = "#fffef8";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    const iconDataUrl = canvas.toDataURL(ICON_CONTENT_TYPE, ICON_QUALITY);
    if (
      !iconDataUrl.startsWith(`data:${ICON_CONTENT_TYPE};base64,`) &&
      !iconDataUrl.startsWith(`data:${FALLBACK_ICON_CONTENT_TYPE};base64,`)
    ) {
      draftIconUrl.value = "";
      localError.value = "このブラウザはアイコン画像の保存形式に対応していません";
      return;
    }

    localError.value = "";
    draftIconUrl.value = iconDataUrl;
  });

  const resetCrop = $(async () => {
    await setZoomImageState({
      currentZoom: MIN_SCALE,
      zoomTarget: sourceImageRef.value,
    });
  });

  const closeCropModal = $(() => {
    cropModalOpen.value = false;
    sourceImageUrl.value = "";
    draftIconUrl.value = "";
    zoomReady.value = false;
  });

  const applyCrop = $(async () => {
    await drawCrop();
    if (draftIconUrl.value) {
      await updateIconUrl(draftIconUrl.value);
    }
    await closeCropModal();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => cropBoxRef.value);
    track(() => sourceImageRef.value);
    track(() => sourceImageUrl.value);
    track(() => cropModalOpen.value);
    if (
      !cropModalOpen.value ||
      !cropBoxRef.value ||
      !sourceImageRef.value ||
      !sourceImageUrl.value ||
      zoomReady.value
    )
      return;

    await createZoomImage(cropBoxRef.value, {
      initialState: { currentZoom: MIN_SCALE, zoomTarget: sourceImageRef.value },
      maxZoom: MAX_SCALE,
      zoomTarget: sourceImageRef.value,
    });
    zoomReady.value = true;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => zoomImageState.currentZoom);
    track(() => zoomImageState.currentPositionX);
    track(() => zoomImageState.currentPositionY);
    await drawCrop();
  });

  return (
    <div class={styles.field}>
      <span class={styles.label}>{label}</span>
      <input
        {...fieldProps}
        ref={async (element) => {
          hiddenInputRef.value = element;
          await fieldProps.ref(element);
        }}
        type="hidden"
        value={iconUrl.value}
      />
      <div class={styles.editor}>
        <div class={styles.cropBox}>
          {iconUrl.value ? (
            <img
              class={styles.previewImage}
              src={iconUrl.value}
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
              onChange$={async (event) => {
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
                  sourceImageUrl.value = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
                    reader.addEventListener("error", () => reject(reader.error));
                    reader.readAsDataURL(file);
                  });
                  draftIconUrl.value = "";
                  zoomReady.value = false;
                  cropModalOpen.value = true;
                  input.value = "";
                } catch {
                  localError.value = "画像を読み込めませんでした";
                  input.value = "";
                }
              }}
            />
          </label>
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
                onLoad$={async () => {
                  await resetCrop();
                  await drawCrop();
                }}
              />
            ) : null}
            {sourceImageUrl.value && <span class={styles.guides} aria-hidden="true" />}
            <span class={styles.mask} aria-hidden="true" />
          </div>
          <div class={styles.modalActions}>
            <Button type="button" variant="secondary" onClick$={closeCropModal}>
              キャンセル
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!draftIconUrl.value}
              onClick$={applyCrop}
            >
              これにする！
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

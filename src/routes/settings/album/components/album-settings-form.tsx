import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/button/button";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import inputStyles from "~/components/ui/form/form-text-input/form-text-input.module.css";
import { Modal } from "~/components/ui/modal/modal";
import { useToast } from "~/components/ui/toast/toast";
import deleteSvg from "~/media/icons/delete.svg";
import {
  albumPhotoSubtitleMaxLength,
  albumPhotoTitleMaxLength,
  maxAlbumPhotoCount,
  type UserAlbumPhoto,
} from "~/schema/album";
import { isImageContentType, maxImageSizeBytes } from "~/schema/image";
import formStyles from "~/routes/signup/index.module.css";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import styles from "./album-settings-form.module.css";

type AlbumSettingsPhoto = {
  imageId: string | null;
  localId: string;
  previewUrl: string | null;
  subtitle: string;
  title: string;
  url: string | null;
};

type AlbumSettingsFormProps = {
  initialPhotos: UserAlbumPhoto[];
};

const toSettingsPhoto = (photo: UserAlbumPhoto, index: number): AlbumSettingsPhoto => ({
  imageId: photo.imageId,
  localId: `${photo.imageId}-${index}`,
  previewUrl: null,
  subtitle: photo.subtitle,
  title: photo.title,
  url: photo.url,
});

const createEmptyPhoto = (): AlbumSettingsPhoto => ({
  imageId: null,
  localId: crypto.randomUUID(),
  previewUrl: null,
  subtitle: "",
  title: "",
  url: null,
});

const getPhotoImageName = (photo: Pick<AlbumSettingsPhoto, "localId">) =>
  `photoImage-${photo.localId}`;

const toSavedPhotos = (photos: AlbumSettingsPhoto[]) =>
  photos.map((photo) => ({
    ...photo,
    previewUrl: null,
    url: photo.imageId ? `/api/images/${photo.imageId}` : photo.url,
  }));

const CROP_OUTPUT_WIDTH = 800;
const CROP_OUTPUT_HEIGHT = 600;
const CROP_ASPECT_RATIO = CROP_OUTPUT_WIDTH / CROP_OUTPUT_HEIGHT;
const MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const PHOTO_CONTENT_TYPE = "image/webp";
const PHOTO_QUALITY = 0.86;
const FALLBACK_PHOTO_CONTENT_TYPE = "image/jpeg";
const PHOTO_OUTPUT_EXTENSIONS = {
  [PHOTO_CONTENT_TYPE]: "webp",
  [FALLBACK_PHOTO_CONTENT_TYPE]: "jpeg",
} as const;
const WHEEL_ZOOM_STEP = 0.12;

type CropDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPositionX: number;
  startPositionY: number;
};

type CropLayout = {
  viewWidth: number;
  viewHeight: number;
  imageWidth: number;
  imageHeight: number;
  maxPositionX: number;
  maxPositionY: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const isPhotoOutputContentType = (value: string): value is keyof typeof PHOTO_OUTPUT_EXTENSIONS =>
  value in PHOTO_OUTPUT_EXTENSIONS;

export const AlbumSettingsForm = component$<AlbumSettingsFormProps>(({ initialPhotos }) => {
  const formRef = useSignal<HTMLFormElement>();
  const photos = useSignal<AlbumSettingsPhoto[]>(initialPhotos.map(toSettingsPhoto));
  const savedPhotos = useSignal<AlbumSettingsPhoto[]>(initialPhotos.map(toSettingsPhoto));
  const isSaving = useSignal(false);
  const saveError = useSignal<string | null>(null);
  const cropPhotoId = useSignal<string | null>(null);
  const sourceImageUrl = useSignal("");
  const sourceImageRef = useSignal<HTMLImageElement>();
  const cropBoxRef = useSignal<HTMLDivElement>();
  const cropModalOpen = useSignal(false);
  const cropImageReady = useSignal(false);
  const cropZoom = useSignal(MIN_SCALE);
  const cropPositionX = useSignal(0);
  const cropPositionY = useSignal(0);
  const cropImageWidth = useSignal(CROP_OUTPUT_WIDTH);
  const cropImageHeight = useSignal(CROP_OUTPUT_HEIGHT);
  const cropDrag = useSignal<CropDragState | null>(null);
  const toast = useToast();

  const readFileAsDataUrl = $((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  });

  const uploadPhoto$ = $(async (file: File) => {
    if (!isImageContentType(file.type)) {
      throw new Error("JPEGまたはWebPの画像を選択してください");
    }
    if (file.size > maxImageSizeBytes) {
      throw new Error("画像は1MB以下にしてください");
    }

    const imageFormData = new FormData();
    imageFormData.set("image", file, file.name);
    const uploadRes = await fetch("/api/images", { method: "POST", body: imageFormData });
    if (!uploadRes.ok) {
      throw new Error("画像をアップロードできませんでした");
    }

    return (await uploadRes.json()) as { imageId: string; url: string };
  });

  const saveAlbum$ = $(
    async (nextPhotos: AlbumSettingsPhoto[], uploadedImageIds: string[] = []) => {
      if (isSaving.value) return false;

      isSaving.value = true;
      saveError.value = null;

      try {
        const payloadPhotos = nextPhotos.flatMap((photo) =>
          photo.imageId
            ? [
                {
                  imageId: photo.imageId,
                  title: photo.title,
                  subtitle: photo.subtitle,
                },
              ]
            : [],
        );

        const response = await fetch("/api/users/me/album", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photos: payloadPhotos }),
        });

        if (!response.ok && uploadedImageIds.length > 0) {
          await Promise.all(
            uploadedImageIds.map((imageId) =>
              fetch(`/api/images/${imageId}`, { method: "DELETE" }),
            ),
          );
        }
        if (response.status === 401) {
          throw new Error("ログインが必要です");
        }
        if (response.status === 404) {
          throw new Error("画像またはプロフィールが見つかりません");
        }
        if (!response.ok) {
          throw new Error("保存に失敗しました");
        }

        const savedPhotoValues = toSavedPhotos(nextPhotos);
        photos.value = savedPhotoValues;
        savedPhotos.value = savedPhotoValues;
        await toast.success("保存しました");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "保存に失敗しました";
        saveError.value = message;
        await toast.error(message);
        return false;
      } finally {
        isSaving.value = false;
      }
    },
  );

  const updatePhotoText = $((photoId: string, fieldName: "subtitle" | "title", value: string) => {
    photos.value = photos.value.map((item) =>
      item.localId === photoId ? { ...item, [fieldName]: value } : item,
    );
    saveError.value = null;
  });

  const restorePhotoText = $((photoId: string, fieldName: "subtitle" | "title") => {
    const savedPhoto = savedPhotos.value.find((item) => item.localId === photoId);
    const restoredValue = savedPhoto?.[fieldName] ?? "";
    photos.value = photos.value.map((item) =>
      item.localId === photoId ? { ...item, [fieldName]: restoredValue } : item,
    );
    saveError.value = null;
  });

  const updateCropLayout = $((): CropLayout | null => {
    const image = sourceImageRef.value;
    const cropBox = cropBoxRef.value;
    if (!image || !cropBox || !image.naturalWidth || !image.naturalHeight) return null;

    const cropRect = cropBox.getBoundingClientRect();
    const viewWidth = cropRect.width || CROP_OUTPUT_WIDTH;
    const viewHeight = cropRect.height || viewWidth / CROP_ASPECT_RATIO;
    const coverScale =
      Math.max(viewWidth / image.naturalWidth, viewHeight / image.naturalHeight) * cropZoom.value;
    const imageWidth = image.naturalWidth * coverScale;
    const imageHeight = image.naturalHeight * coverScale;
    const maxPositionX = Math.max(0, (imageWidth - viewWidth) / 2);
    const maxPositionY = Math.max(0, (imageHeight - viewHeight) / 2);

    cropImageWidth.value = imageWidth;
    cropImageHeight.value = imageHeight;
    cropPositionX.value = clamp(cropPositionX.value, -maxPositionX, maxPositionX);
    cropPositionY.value = clamp(cropPositionY.value, -maxPositionY, maxPositionY);

    return { viewWidth, viewHeight, imageWidth, imageHeight, maxPositionX, maxPositionY };
  });

  const drawCrop = $(async () => {
    const image = sourceImageRef.value;
    const cropBox = cropBoxRef.value;
    if (!image || !cropBox || !image.naturalWidth || !image.naturalHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = CROP_OUTPUT_WIDTH;
    canvas.height = CROP_OUTPUT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const cropRect = cropBox.getBoundingClientRect();
    const viewWidth = cropRect.width || CROP_OUTPUT_WIDTH;
    const viewHeight = cropRect.height || viewWidth / CROP_ASPECT_RATIO;
    const viewToOutput = CROP_OUTPUT_WIDTH / viewWidth;
    const drawScale =
      Math.max(viewWidth / image.naturalWidth, viewHeight / image.naturalHeight) *
      cropZoom.value *
      viewToOutput;
    const drawWidth = image.naturalWidth * drawScale;
    const drawHeight = image.naturalHeight * drawScale;
    const drawX = (CROP_OUTPUT_WIDTH - drawWidth) / 2 + cropPositionX.value * viewToOutput;
    const drawY = (CROP_OUTPUT_HEIGHT - drawHeight) / 2 + cropPositionY.value * viewToOutput;

    context.fillStyle = "#fffef8";
    context.fillRect(0, 0, CROP_OUTPUT_WIDTH, CROP_OUTPUT_HEIGHT);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const toBlob = (contentType: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, contentType, PHOTO_QUALITY));

    let blob = await toBlob(PHOTO_CONTENT_TYPE);
    if (!blob || !isPhotoOutputContentType(blob.type)) {
      blob = await toBlob(FALLBACK_PHOTO_CONTENT_TYPE);
    }

    if (!blob || !isPhotoOutputContentType(blob.type)) {
      saveError.value = "このブラウザは写真の保存形式に対応していません";
      return null;
    }

    const extension = PHOTO_OUTPUT_EXTENSIONS[blob.type];
    return new File([blob], `album-photo.${extension}`, { type: blob.type });
  });

  const resetCrop = $(async () => {
    cropZoom.value = MIN_SCALE;
    cropPositionX.value = 0;
    cropPositionY.value = 0;
    await updateCropLayout();
  });

  const closeCropModal = $(() => {
    cropModalOpen.value = false;
    cropPhotoId.value = null;
    sourceImageUrl.value = "";
    cropImageReady.value = false;
    cropDrag.value = null;
  });

  const applyCrop = $(async () => {
    const photoId = cropPhotoId.value;
    const croppedPhoto = await drawCrop();
    const form = formRef.value;
    if (!photoId || !croppedPhoto || !form) {
      await closeCropModal();
      return;
    }

    const input = form.elements.namedItem(getPhotoImageName({ localId: photoId }));
    if (input instanceof HTMLInputElement) {
      const files = new DataTransfer();
      files.items.add(croppedPhoto);
      input.files = files.files;
    }

    const nextPreviewUrl = URL.createObjectURL(croppedPhoto);
    const previewPhotos = photos.value.map((item) => {
      if (item.localId !== photoId) return item;
      if (item.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return {
        ...item,
        previewUrl: nextPreviewUrl,
      };
    });

    photos.value = previewPhotos;
    saveError.value = null;
    await closeCropModal();

    const previousPhotos = savedPhotos.value;
    let uploadedImageId: string | null = null;
    try {
      const uploaded = await uploadPhoto$(croppedPhoto);
      uploadedImageId = uploaded.imageId;
      const nextPhotos = previewPhotos.map((item) =>
        item.localId === photoId
          ? { ...item, imageId: uploaded.imageId, previewUrl: null, url: uploaded.url }
          : item,
      );
      const saved = await saveAlbum$(nextPhotos, [uploaded.imageId]);
      if (!saved) {
        photos.value = previousPhotos;
      }
    } catch (error) {
      if (uploadedImageId) {
        await fetch(`/api/images/${uploadedImageId}`, { method: "DELETE" });
      }
      photos.value = previousPhotos;
      const message = error instanceof Error ? error.message : "保存に失敗しました";
      saveError.value = message;
      await toast.error(message);
    }
  });

  const handleSourceFileChange = $(async (event: Event, photoId: string) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    saveError.value = null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      saveError.value = "画像ファイルを選択してください";
      input.value = "";
      return;
    }

    if (file.size > MAX_SOURCE_SIZE) {
      saveError.value = "20MB以下の画像を選択してください";
      input.value = "";
      return;
    }

    try {
      sourceImageUrl.value = await readFileAsDataUrl(file);
      cropPhotoId.value = photoId;
      cropImageReady.value = false;
      cropDrag.value = null;
      cropModalOpen.value = true;
      input.value = "";
    } catch {
      saveError.value = "画像を読み込めませんでした";
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
    const viewWidth = cropRect.width || CROP_OUTPUT_WIDTH;
    const viewHeight = cropRect.height || viewWidth / CROP_ASPECT_RATIO;
    const oldZoom = cropZoom.value;
    const newZoom = clamp(
      oldZoom * (event.deltaY < 0 ? 1 + WHEEL_ZOOM_STEP : 1 - WHEEL_ZOOM_STEP),
      MIN_SCALE,
      MAX_SCALE,
    );
    if (newZoom === oldZoom) return;

    const coverScale = Math.max(viewWidth / image.naturalWidth, viewHeight / image.naturalHeight);
    const oldImageWidth = image.naturalWidth * coverScale * oldZoom;
    const oldImageHeight = image.naturalHeight * coverScale * oldZoom;
    const newImageWidth = image.naturalWidth * coverScale * newZoom;
    const newImageHeight = image.naturalHeight * coverScale * newZoom;
    const oldImageLeft = (viewWidth - oldImageWidth) / 2 + cropPositionX.value;
    const oldImageTop = (viewHeight - oldImageHeight) / 2 + cropPositionY.value;
    const zoomPointX = event.clientX - cropRect.left;
    const zoomPointY = event.clientY - cropRect.top;
    const imagePointX = (zoomPointX - oldImageLeft) / oldImageWidth;
    const imagePointY = (zoomPointY - oldImageTop) / oldImageHeight;
    const maxPositionX = Math.max(0, (newImageWidth - viewWidth) / 2);
    const maxPositionY = Math.max(0, (newImageHeight - viewHeight) / 2);

    cropZoom.value = newZoom;
    cropPositionX.value = clamp(
      zoomPointX - imagePointX * newImageWidth - (viewWidth - newImageWidth) / 2,
      -maxPositionX,
      maxPositionX,
    );
    cropPositionY.value = clamp(
      zoomPointY - imagePointY * newImageHeight - (viewHeight - newImageHeight) / 2,
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
    <form
      ref={formRef}
      preventdefault:submit
      class={`${formStyles.form} ${sharedStyles.content} ${styles.panel}`}
      onSubmit$={async () => {
        await saveAlbum$(photos.value);
      }}
    >
      <div class={styles.photoList}>
        {photos.value.map((photo, index) => (
          <section key={photo.localId} class={styles.photoEditor}>
            <div class={styles.photoHeader}>
              <h2>写真 {index + 1}</h2>
              <Button
                type="button"
                label="削除"
                onClick$={async () => {
                  if (!confirm("本当に削除しますか？")) return;

                  const previousPhotos = photos.value;
                  const nextPhotos = photos.value.filter((item) => item.localId !== photo.localId);
                  photos.value = nextPhotos;
                  saveError.value = null;

                  const saved = await saveAlbum$(nextPhotos);
                  if (!saved) {
                    photos.value = previousPhotos;
                  }
                }}
              >
                <img src={deleteSvg} alt="" width={24} height={24} />
              </Button>
            </div>

            <label class={styles.imagePicker} aria-label="写真を選ぶ">
              <span class={styles.previewFrame}>
                {photo.previewUrl || photo.url ? (
                  <img src={photo.previewUrl ?? photo.url ?? ""} alt="" width={320} height={240} />
                ) : (
                  <span>写真を選択</span>
                )}
                <span class={styles.fileOverlay} aria-hidden="true">
                  <span>+</span>
                </span>
              </span>
              <input
                type="file"
                name={getPhotoImageName(photo)}
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange$={(event) => handleSourceFileChange(event, photo.localId)}
              />
            </label>

            <label class={inputStyles.field}>
              <span class={inputStyles.label}>
                タイトル（任意・最大{albumPhotoTitleMaxLength}文字）
              </span>
              <input
                type="text"
                class={inputStyles.input}
                value={photo.title}
                maxLength={albumPhotoTitleMaxLength}
                onInput$={(_, target) => {
                  updatePhotoText(photo.localId, "title", target.value);
                }}
              />
            </label>
            {photo.title !==
              (savedPhotos.value.find((item) => item.localId === photo.localId)?.title ?? "") && (
              <div class={styles.fieldActions}>
                <FormButton
                  type="button"
                  variant="secondary"
                  disabled={isSaving.value}
                  onClick$={() => restorePhotoText(photo.localId, "title")}
                >
                  キャンセル
                </FormButton>
                {photo.imageId && (
                  <FormButton
                    type="submit"
                    variant="primary"
                    disabled={isSaving.value}
                    aria-busy={isSaving.value}
                  >
                    {isSaving.value ? "保存中..." : "保存する"}
                  </FormButton>
                )}
              </div>
            )}

            <label class={inputStyles.field}>
              <span class={inputStyles.label}>
                サブタイトル（任意・最大{albumPhotoSubtitleMaxLength}文字）
              </span>
              <input
                type="text"
                class={inputStyles.input}
                value={photo.subtitle}
                maxLength={albumPhotoSubtitleMaxLength}
                onInput$={(_, target) => {
                  updatePhotoText(photo.localId, "subtitle", target.value);
                }}
              />
            </label>
            {photo.subtitle !==
              (savedPhotos.value.find((item) => item.localId === photo.localId)?.subtitle ??
                "") && (
              <div class={styles.fieldActions}>
                <FormButton
                  type="button"
                  variant="secondary"
                  disabled={isSaving.value}
                  onClick$={() => restorePhotoText(photo.localId, "subtitle")}
                >
                  キャンセル
                </FormButton>
                {photo.imageId && (
                  <FormButton
                    type="submit"
                    variant="primary"
                    disabled={isSaving.value}
                    aria-busy={isSaving.value}
                  >
                    {isSaving.value ? "保存中..." : "保存する"}
                  </FormButton>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {saveError.value && <p class={styles.errorMessage}>{saveError.value}</p>}

      <div class={styles.actions}>
        <FormButton
          type="button"
          variant="secondary"
          size="md"
          width="full"
          disabled={photos.value.length >= maxAlbumPhotoCount || isSaving.value}
          onClick$={() => {
            if (photos.value.length >= maxAlbumPhotoCount) return;
            photos.value = [...photos.value, createEmptyPhoto()];
            saveError.value = null;
          }}
        >
          写真を追加
        </FormButton>
      </div>
      <Modal open={cropModalOpen.value} title="写真を調整" onClose$={closeCropModal}>
        <div class={styles.modalEditor}>
          <div
            ref={cropBoxRef}
            class={styles.cropBox}
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
                width={CROP_OUTPUT_WIDTH}
                height={CROP_OUTPUT_HEIGHT}
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
            <span class={styles.cropMask} aria-hidden="true" />
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
    </form>
  );
});

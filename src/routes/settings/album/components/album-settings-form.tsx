import { component$, useSignal } from "@builder.io/qwik";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import inputStyles from "~/components/ui/form/form-text-input/form-text-input.module.css";
import { useToast } from "~/components/ui/toast/toast";
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

export const AlbumSettingsForm = component$<AlbumSettingsFormProps>(({ initialPhotos }) => {
  const formRef = useSignal<HTMLFormElement>();
  const photos = useSignal<AlbumSettingsPhoto[]>(initialPhotos.map(toSettingsPhoto));
  const isSaving = useSignal(false);
  const saveError = useSignal<string | null>(null);
  const toast = useToast();

  return (
    <form
      ref={formRef}
      preventdefault:submit
      class={`${formStyles.form} ${sharedStyles.content} ${styles.panel}`}
      onSubmit$={async () => {
        if (isSaving.value) return;

        const form = formRef.value;
        if (!form) return;

        isSaving.value = true;
        saveError.value = null;
        const uploadedImageIds: string[] = [];

        try {
          const formData = new FormData(form);
          const payloadPhotos = [];

          for (const photo of photos.value) {
            let imageId = photo.imageId;
            const file = formData.get(getPhotoImageName(photo));

            if (file instanceof File && file.size > 0) {
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
              const uploaded = (await uploadRes.json()) as { imageId: string; url: string };
              imageId = uploaded.imageId;
              uploadedImageIds.push(uploaded.imageId);
            }

            if (!imageId) {
              throw new Error("写真を選択してください");
            }

            payloadPhotos.push({
              imageId,
              title: photo.title,
              subtitle: photo.subtitle,
            });
          }

          const response = await fetch("/api/users/me/album", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ photos: payloadPhotos }),
          });

          if (!response.ok) {
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

          const savedPhotos = payloadPhotos.map((photo, index) => ({
            ...photos.value[index],
            imageId: photo.imageId,
            previewUrl: null,
            url: `/api/images/${photo.imageId}`,
          }));
          photos.value = savedPhotos;
          form.reset();
          await toast.success("保存しました");
        } catch (error) {
          const message = error instanceof Error ? error.message : "保存に失敗しました";
          saveError.value = message;
          await toast.error(message);
        } finally {
          isSaving.value = false;
        }
      }}
    >
      <div class={styles.photoList}>
        {photos.value.map((photo, index) => (
          <section key={photo.localId} class={styles.photoEditor}>
            <div class={styles.photoHeader}>
              <h2>写真 {index + 1}</h2>
              <button
                type="button"
                class={styles.removeButton}
                onClick$={() => {
                  photos.value = photos.value.filter((item) => item.localId !== photo.localId);
                  saveError.value = null;
                }}
              >
                削除
              </button>
            </div>

            <label class={styles.imagePicker}>
              <span class={styles.previewFrame}>
                {photo.previewUrl || photo.url ? (
                  <img src={photo.previewUrl ?? photo.url ?? ""} alt="" width={320} height={240} />
                ) : (
                  <span>写真を選択</span>
                )}
              </span>
              <input
                type="file"
                name={getPhotoImageName(photo)}
                accept="image/jpeg,image/webp"
                onChange$={(_, target) => {
                  const file = target.files?.[0];
                  if (!file) return;

                  if (!isImageContentType(file.type)) {
                    target.value = "";
                    saveError.value = "JPEGまたはWebPの画像を選択してください";
                    return;
                  }
                  if (file.size > maxImageSizeBytes) {
                    target.value = "";
                    saveError.value = "画像は1MB以下にしてください";
                    return;
                  }

                  photos.value = photos.value.map((item) =>
                    item.localId === photo.localId
                      ? {
                          ...item,
                          previewUrl: URL.createObjectURL(file),
                        }
                      : item,
                  );
                  saveError.value = null;
                }}
              />
            </label>

            <label class={inputStyles.field}>
              <span class={inputStyles.label}>タイトル</span>
              <input
                type="text"
                class={inputStyles.input}
                value={photo.title}
                maxLength={albumPhotoTitleMaxLength}
                onInput$={(_, target) => {
                  photos.value = photos.value.map((item) =>
                    item.localId === photo.localId ? { ...item, title: target.value } : item,
                  );
                  saveError.value = null;
                }}
              />
            </label>

            <label class={inputStyles.field}>
              <span class={inputStyles.label}>サブタイトル</span>
              <input
                type="text"
                class={inputStyles.input}
                value={photo.subtitle}
                maxLength={albumPhotoSubtitleMaxLength}
                onInput$={(_, target) => {
                  photos.value = photos.value.map((item) =>
                    item.localId === photo.localId ? { ...item, subtitle: target.value } : item,
                  );
                  saveError.value = null;
                }}
              />
            </label>
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
        <FormButton
          type="submit"
          variant="accent"
          size="md"
          width="full"
          disabled={isSaving.value}
          aria-busy={isSaving.value}
        >
          {isSaving.value ? "保存中..." : "保存する"}
        </FormButton>
      </div>
    </form>
  );
});

import { $, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { FormError, type InitialValues, useForm, valiForm$ } from "@modular-forms/qwik";
import type * as v from "valibot";
import {
  setCommonHeaderUser,
  useCommonHeaderUser,
} from "~/components/common-header/common-header-state";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import { FormTextInput } from "~/components/ui/form/form-text-input/form-text-input";
import { IconCropInput } from "~/components/ui/form/icon-crop-input/icon-crop-input";
import { useToast } from "~/components/ui/toast/toast";
import { createApiClient } from "~/lib/api";
import { createProfileOgpImageFile } from "~/lib/profile-ogp-image";
import { NAME_MAX_LENGTH, PUBLIC_ID_MAX_LENGTH, userSchema } from "~/schema/user";
import formStyles from "~/routes/signup/index.module.css";
import styles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import profileStyles from "./index.module.css";

type ProfileSettingsForm = v.InferInput<typeof userSchema>;

export const useProfileSettingsLoader = routeLoader$<InitialValues<ProfileSettingsForm>>(
  async (event) => {
    const client = createApiClient(event);
    const res = await client.api.users.me.$get();
    if (res.status === 401) throw event.redirect(302, "/");
    if (res.status === 404) throw event.redirect(302, "/signup/");
    if (!res.ok) throw new Error("プロフィールを取得できませんでした");

    const profile = await res.json();
    return {
      publicId: profile.publicId,
      name: profile.name,
      icon: profile.icon ?? "",
      ogp: profile.ogp ?? "",
    };
  },
);

export default component$(() => {
  const initialProfile = useProfileSettingsLoader();
  const [profileForm, { Form, Field }] = useForm<ProfileSettingsForm>({
    loader: initialProfile,
    validate: valiForm$(userSchema),
  });
  const toast = useToast();
  const headerUser = useCommonHeaderUser();
  const savedPublicId = useSignal<string>(initialProfile.value.publicId ?? "");
  const savedName = useSignal<string>(initialProfile.value.name ?? "");
  const publicIdValue = useSignal(savedPublicId.value);
  const nameValue = useSignal(savedName.value);

  const uploadImage$ = $(async (image: File, errorMessage: string) => {
    const imageFormData = new FormData();
    imageFormData.set("image", image, image.name);
    const uploadRes = await fetch("/api/images", { method: "POST", body: imageFormData });
    if (!uploadRes.ok) {
      throw new Error(errorMessage);
    }

    const uploaded = (await uploadRes.json()) as { imageId: string };
    return uploaded.imageId;
  });

  const uploadProfileOgp$ = $(
    async (values: Pick<ProfileSettingsForm, "publicId" | "name" | "icon">) => {
      const ogpImage = await createProfileOgpImageFile({
        publicId: values.publicId,
        name: values.name,
        icon: values.icon || null,
      });
      return uploadImage$(ogpImage, "OGP画像をアップロードできませんでした");
    },
  );

  const saveProfile$ = $(async (values: ProfileSettingsForm) => {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.status === 401) {
      throw new FormError<ProfileSettingsForm>("ログインが必要です");
    }
    if (res.status === 409) {
      throw new FormError<ProfileSettingsForm>({
        publicId: "このIDはすでに使用されています",
      });
    }
    if (!res.ok) {
      throw new FormError<ProfileSettingsForm>("保存に失敗しました");
    }
  });

  const setFormFieldValue$ = $((form: HTMLFormElement | null, fieldName: string, value: string) => {
    const input = form?.elements.namedItem(fieldName);
    if (!(input instanceof HTMLInputElement)) return;

    input.value = value;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  return (
    <>
      <Form
        class={`${formStyles.form} ${styles.content}`}
        onSubmit$={async (values, event) => {
          const form = event.target as HTMLFormElement;
          const iconImage = new FormData(form).get("iconImage");
          let uploadedIcon: string | null = null;
          let uploadedOgp: string | null = null;
          let savedIcon = values.icon;

          try {
            if (iconImage instanceof File && iconImage.size > 0) {
              uploadedIcon = await uploadImage$(
                iconImage,
                "アイコン画像をアップロードできませんでした",
              );
            }

            const nextValues = { ...values, icon: uploadedIcon ?? values.icon };
            savedIcon = nextValues.icon;
            uploadedOgp = await uploadProfileOgp$(nextValues);

            await saveProfile$({ ...nextValues, ogp: uploadedOgp });
          } catch (error) {
            await Promise.all(
              [uploadedIcon, uploadedOgp]
                .filter((imageId): imageId is string => Boolean(imageId))
                .map((imageId) => fetch(`/api/images/${imageId}`, { method: "DELETE" })),
            );
            throw error instanceof FormError
              ? error
              : new FormError<ProfileSettingsForm>(
                  error instanceof Error ? error.message : "保存に失敗しました",
                );
          }

          if (uploadedIcon) {
            const iconImageInput = form.elements.namedItem("iconImage") as HTMLInputElement | null;
            if (iconImageInput) iconImageInput.value = "";
          }
          if (uploadedOgp) {
            await setFormFieldValue$(form, "ogp", uploadedOgp);
          }

          savedPublicId.value = values.publicId;
          savedName.value = values.name;
          publicIdValue.value = values.publicId;
          nameValue.value = values.name;
          setCommonHeaderUser(headerUser, {
            authenticated: true,
            publicId: values.publicId,
            name: values.name,
            icon: savedIcon || null,
          });
          await toast.success("保存しました");
        }}
      >
        <div class={formStyles.fields}>
          <Field name="publicId">
            {(field, props) => (
              <>
                <FormTextInput
                  label={`ID（半角英数字とアンダースコア、最大${PUBLIC_ID_MAX_LENGTH}文字）`}
                  field={field}
                  fieldProps={props}
                  maxLength={PUBLIC_ID_MAX_LENGTH}
                  onInput$={(value) => {
                    publicIdValue.value = value;
                  }}
                  required
                />
                {publicIdValue.value !== savedPublicId.value && (
                  <div class={profileStyles.fieldActions}>
                    <FormButton
                      type="button"
                      variant="secondary"
                      disabled={profileForm.submitting}
                      onClick$={async (_, button) => {
                        publicIdValue.value = savedPublicId.value;
                        await setFormFieldValue$(button.form, "publicId", savedPublicId.value);
                      }}
                    >
                      キャンセル
                    </FormButton>
                    <FormButton
                      type="submit"
                      variant="primary"
                      disabled={profileForm.submitting}
                      aria-busy={profileForm.submitting}
                    >
                      {profileForm.submitting ? "保存中..." : "保存する"}
                    </FormButton>
                  </div>
                )}
              </>
            )}
          </Field>
          <Field name="name">
            {(field, props) => (
              <>
                <FormTextInput
                  label={`名前（最大${NAME_MAX_LENGTH}文字）`}
                  field={field}
                  fieldProps={props}
                  maxLength={NAME_MAX_LENGTH}
                  onInput$={(value) => {
                    nameValue.value = value;
                  }}
                  required
                />
                {nameValue.value !== savedName.value && (
                  <div class={profileStyles.fieldActions}>
                    <FormButton
                      type="button"
                      variant="secondary"
                      disabled={profileForm.submitting}
                      onClick$={async (_, button) => {
                        nameValue.value = savedName.value;
                        await setFormFieldValue$(button.form, "name", savedName.value);
                      }}
                    >
                      キャンセル
                    </FormButton>
                    <FormButton
                      type="submit"
                      variant="primary"
                      disabled={profileForm.submitting}
                      aria-busy={profileForm.submitting}
                    >
                      {profileForm.submitting ? "保存中..." : "保存する"}
                    </FormButton>
                  </div>
                )}
              </>
            )}
          </Field>
          <Field name="icon">
            {(field, props) => (
              <IconCropInput
                label="アイコン"
                field={field}
                fieldProps={props}
                onApply$={async (iconImage) => {
                  let uploadedIcon: string | null = null;
                  let uploadedOgp: string | null = null;
                  try {
                    uploadedIcon = await uploadImage$(
                      iconImage,
                      "アイコン画像をアップロードできませんでした",
                    );
                    uploadedOgp = await uploadProfileOgp$({
                      publicId: savedPublicId.value,
                      name: savedName.value,
                      icon: uploadedIcon,
                    });
                    await saveProfile$({
                      publicId: savedPublicId.value,
                      name: savedName.value,
                      icon: uploadedIcon,
                      ogp: uploadedOgp,
                    });
                  } catch (error) {
                    await Promise.all(
                      [uploadedIcon, uploadedOgp]
                        .filter((imageId): imageId is string => Boolean(imageId))
                        .map((imageId) => fetch(`/api/images/${imageId}`, { method: "DELETE" })),
                    );
                    await toast.error(
                      error instanceof Error ? error.message : "アイコンの保存に失敗しました",
                    );
                    throw error;
                  }

                  setCommonHeaderUser(headerUser, {
                    authenticated: true,
                    publicId: savedPublicId.value,
                    name: savedName.value,
                    icon: uploadedIcon,
                  });
                  await toast.success("保存しました");
                  return uploadedIcon;
                }}
              />
            )}
          </Field>
          <Field name="ogp">
            {(field, props) => <input {...props} type="hidden" value={field.value ?? ""} />}
          </Field>
          {profileForm.response.status === "error" && profileForm.response.message && (
            <FormErrorMessage message={profileForm.response.message} />
          )}
        </div>
      </Form>
    </>
  );
});

export const head: DocumentHead = {
  title: "プロフィール設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaのプロフィール設定ページ" }],
};

import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { FormError, type InitialValues, useForm, valiForm$ } from "@modular-forms/qwik";
import type * as v from "valibot";
import { Button } from "~/components/ui/button/button";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormTextInput } from "~/components/ui/form/form-text-input/form-text-input";
import { IconCropInput } from "~/components/ui/form/icon-crop-input/icon-crop-input";
import { useToast } from "~/components/ui/toast/toast";
import { createApiClient } from "~/lib/api";
import { NAME_MAX_LENGTH, PUBLIC_ID_MAX_LENGTH, userSchema } from "~/schema/user";
import formStyles from "~/routes/signup/index.module.css";
import styles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";

type ProfileSettingsForm = v.InferInput<typeof userSchema>;

export const useProfileSettingsLoader = routeLoader$<InitialValues<ProfileSettingsForm>>(
  async (event) => {
    const client = createApiClient(event);
    const res = await client.api.users.me.$get();
    if (res.status === 401) throw event.redirect(302, "/");
    if (res.status === 404) throw event.redirect(302, "/signup");
    if (!res.ok) throw new Error("プロフィールを取得できませんでした");

    const profile = await res.json();
    return {
      publicId: profile.publicId,
      name: profile.name,
      icon: profile.icon ?? "",
    };
  },
);

export default component$(() => {
  const [profileForm, { Form, Field }] = useForm<ProfileSettingsForm>({
    loader: useProfileSettingsLoader(),
    validate: valiForm$(userSchema),
  });
  const toast = useToast();

  return (
    <>
      <Form
        class={`${formStyles.form} ${styles.content}`}
        onSubmit$={async (values, event) => {
          const form = event.target as HTMLFormElement;
          const iconImage = new FormData(form).get("iconImage");
          let uploadedIcon: string | null = null;

          if (iconImage instanceof File && iconImage.size > 0) {
            const imageFormData = new FormData();
            imageFormData.set("image", iconImage, iconImage.name);
            const uploadRes = await fetch("/api/images", { method: "POST", body: imageFormData });
            if (!uploadRes.ok) {
              throw new FormError<ProfileSettingsForm>(
                "アイコン画像をアップロードできませんでした",
              );
            }
            const uploaded = (await uploadRes.json()) as { imageId: string };
            uploadedIcon = uploaded.imageId;
          }

          const res = await fetch("/api/users/me", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...values, icon: uploadedIcon ?? values.icon }),
          });

          if (!res.ok && uploadedIcon) {
            await fetch(`/api/images/${uploadedIcon}`, { method: "DELETE" });
          }
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

          await toast.success("保存しました");
        }}
      >
        <div class={formStyles.fields}>
          <Field name="publicId">
            {(field, props) => (
              <FormTextInput
                label={`ID（半角英数字とアンダースコア、最大${PUBLIC_ID_MAX_LENGTH}文字）`}
                field={field}
                fieldProps={props}
                maxLength={PUBLIC_ID_MAX_LENGTH}
                required
              />
            )}
          </Field>
          <Field name="name">
            {(field, props) => (
              <FormTextInput
                label={`名前（最大${NAME_MAX_LENGTH}文字）`}
                field={field}
                fieldProps={props}
                maxLength={NAME_MAX_LENGTH}
                required
              />
            )}
          </Field>
          <Field name="icon">
            {(field, props) => <IconCropInput label="アイコン" field={field} fieldProps={props} />}
          </Field>
          {profileForm.response.status === "error" && profileForm.response.message && (
            <FormErrorMessage message={profileForm.response.message} />
          )}
        </div>
        <div class={formStyles.actions}>
          <Button
            type="submit"
            variant="accent"
            size="md"
            width="full"
            disabled={profileForm.submitting}
            aria-busy={profileForm.submitting}
          >
            {profileForm.submitting ? "保存中..." : "保存する"}
          </Button>
        </div>
      </Form>
    </>
  );
});

export const head: DocumentHead = {
  title: "プロフィール設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaのプロフィール設定ページ" }],
};

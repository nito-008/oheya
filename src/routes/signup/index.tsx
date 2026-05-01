import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { FormError, type InitialValues, useForm, valiForm$ } from "@modular-forms/qwik";
import type * as v from "valibot";
import { Button } from "~/components/ui/button/button";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormTextInput } from "~/components/ui/form/form-text-input/form-text-input";
import { IconCropInput } from "~/components/ui/form/icon-crop-input/icon-crop-input";
import { createApiClient } from "~/lib/api";
import { NAME_MAX_LENGTH, PUBLIC_ID_MAX_LENGTH, userSchema } from "~/schema/user";
import styles from "./index.module.css";

type SignupForm = v.InferInput<typeof userSchema>;

export const useProfileStatus = routeLoader$(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$get();
  if (res.ok) {
    const profile = await res.json();
    throw event.redirect(302, `/${profile.publicId}`);
  }
  if (res.status === 401) throw event.redirect(302, "/");
  if (res.status === 404) return;
  throw new Error("プロフィールを取得できませんでした");
});

export const useFormLoader = routeLoader$<InitialValues<SignupForm>>(() => ({
  publicId: "",
  name: "",
  icon: "",
}));

export default component$(() => {
  useProfileStatus();
  const [signupForm, { Form, Field }] = useForm<SignupForm>({
    loader: useFormLoader(),
    validate: valiForm$(userSchema),
  });

  return (
    <main class={styles.main}>
      <h1>アカウント登録</h1>
      <Form
        class={styles.form}
        onSubmit$={async (values, event) => {
          const form = event.target as HTMLFormElement;
          const iconImage = new FormData(form).get("iconImage");
          let uploadedIcon: string | null = null;

          if (iconImage instanceof File && iconImage.size > 0) {
            const imageFormData = new FormData();
            imageFormData.set("image", iconImage, iconImage.name);
            const uploadRes = await fetch("/api/images", { method: "POST", body: imageFormData });
            if (!uploadRes.ok) {
              throw new FormError<SignupForm>("アイコン画像をアップロードできませんでした");
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
            throw new FormError<SignupForm>("ログインが必要です");
          }
          if (res.status === 409) {
            throw new FormError<SignupForm>({
              publicId: "このIDはすでに使用されています",
            });
          }
          if (!res.ok) {
            throw new FormError<SignupForm>("登録に失敗しました");
          }

          window.location.href = `/${values.publicId}`;
        }}
      >
        <div class={styles.fields}>
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
          {signupForm.response.status === "error" && signupForm.response.message && (
            <FormErrorMessage message={signupForm.response.message} />
          )}
        </div>
        <div class={styles.actions}>
          <Button
            type="submit"
            variant="accent"
            size="md"
            width="full"
            disabled={signupForm.submitting}
            aria-busy={signupForm.submitting}
          >
            {signupForm.submitting ? "登録中..." : "はじめる"}
          </Button>
        </div>
      </Form>
    </main>
  );
});

export const head: DocumentHead = {
  title: "はじめる | Oheya",
  meta: [{ name: "description", content: "Oheyaのユーザー登録ページ" }],
};

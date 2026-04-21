import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import {
  FormError,
  type InitialValues,
  formAction$,
  useForm,
  valiForm$,
} from "@modular-forms/qwik";
import type * as v from "valibot";
import { AvatarCropInput } from "~/components/ui/form/avatar-crop-input/avatar-crop-input";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormTextInput } from "~/components/ui/form/form-text-input/form-text-input";
import { Button } from "~/components/ui/button/button";
import { createApiClient } from "~/lib/api";
import { NAME_MAX_LENGTH, PUBLIC_ID_MAX_LENGTH, userSchema } from "~/schema/user";
import styles from "~/routes/signup/index.module.css";

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
      iconUrl: profile.iconUrl ?? "",
    };
  },
);

export const useSaveProfileSettings = formAction$<ProfileSettingsForm>(async (values, event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$patch({ json: values });
  if (res.status === 401) {
    throw new FormError<ProfileSettingsForm>("ログインが必要です");
  }
  if (res.status === 409) {
    throw new FormError<ProfileSettingsForm>({ publicId: "このIDはもう誰かが使っています" });
  }
  if (!res.ok) {
    throw new FormError<ProfileSettingsForm>("保存できませんでした");
  }
  throw event.redirect(302, `/${values.publicId}`);
}, valiForm$(userSchema));

export default component$(() => {
  const [profileForm, { Form, Field }] = useForm<ProfileSettingsForm>({
    loader: useProfileSettingsLoader(),
    action: useSaveProfileSettings(),
    validate: valiForm$(userSchema),
  });

  return (
    <main class={styles.main}>
      <h1>プロフィール設定</h1>
      <Form class={styles.form}>
        <div class={styles.fields}>
          <Field name="publicId">
            {(field, props) => (
              <FormTextInput
                label={`ID（英数字とアンダースコア、最大${PUBLIC_ID_MAX_LENGTH}文字）`}
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
          <Field name="iconUrl">
            {(field, props) => (
              <AvatarCropInput label="アイコン" field={field} fieldProps={props} />
            )}
          </Field>
          {profileForm.response.status === "error" && profileForm.response.message && (
            <FormErrorMessage message={profileForm.response.message} />
          )}
        </div>
        <div class={styles.actions}>
          <Button
            type="submit"
            variant="accent"
            size="md"
            width="full"
            disabled={profileForm.submitting}
            aria-busy={profileForm.submitting}
          >
            {profileForm.submitting ? "保存しています..." : "保存する"}
          </Button>
        </div>
      </Form>
    </main>
  );
});

export const head: DocumentHead = {
  title: "プロフィール設定 | Oheya",
  meta: [{ name: "description", content: "Oheyaのプロフィール設定ページ" }],
};

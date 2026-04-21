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
import { IconCropInput } from "~/components/ui/form/icon-crop-input/icon-crop-input";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormTextInput } from "~/components/ui/form/form-text-input/form-text-input";
import { Button } from "~/components/ui/button/button";
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
  iconUrl: "",
}));

export const useRegisterProfile = formAction$<SignupForm>(async (values, event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$patch({ json: values });
  if (res.status === 401) {
    throw new FormError<SignupForm>("ログインが必要です");
  }
  if (res.status === 409) {
    throw new FormError<SignupForm>({ publicId: "このIDはもう誰かが使っています" });
  }
  if (!res.ok) {
    throw new FormError<SignupForm>("登録できませんでした");
  }
  throw event.redirect(302, `/${values.publicId}`);
}, valiForm$(userSchema));

export default component$(() => {
  useProfileStatus();
  const [signupForm, { Form, Field }] = useForm<SignupForm>({
    loader: useFormLoader(),
    action: useRegisterProfile(),
    validate: valiForm$(userSchema),
  });

  return (
    <main class={styles.main}>
      <h1>アカウント登録</h1>
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

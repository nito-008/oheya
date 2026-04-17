import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form as AuthForm, routeLoader$ } from "@builder.io/qwik-city";
import {
  FormError,
  type InitialValues,
  formAction$,
  useForm,
  valiForm$,
} from "@modular-forms/qwik";
import type * as v from "valibot";
import { createApiClient } from "~/lib/api";
import { useSignIn } from "~/routes/plugin@auth";
import { NAME_MAX_LENGTH, PUBLIC_ID_MAX_LENGTH, userSchema } from "~/schema/user";
import styles from "./index.module.css";

type SignupForm = v.InferInput<typeof userSchema>;

export const useProfileStatus = routeLoader$(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$get();
  const data = await res.json();
  if (data.state === "registered") throw event.redirect(302, "/");
  return data;
});

export const useFormLoader = routeLoader$<InitialValues<SignupForm>>(() => ({
  publicId: "",
  name: "",
}));

export const useRegisterProfile = formAction$<SignupForm>(async (values, event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$patch({ json: values });
  if (res.status === 401) {
    throw new FormError<SignupForm>("ログインが必要です");
  }
  if (res.status === 409) {
    throw new FormError<SignupForm>({ publicId: "このIDはすでに誰かが使っています" });
  }
  if (!res.ok) {
    throw new FormError<SignupForm>("登録に失敗しました");
  }
  throw event.redirect(302, "/");
}, valiForm$(userSchema));

export default component$(() => {
  const status = useProfileStatus();
  const signIn = useSignIn();
  const [signupForm, { Form, Field }] = useForm<SignupForm>({
    loader: useFormLoader(),
    action: useRegisterProfile(),
    validate: valiForm$(userSchema),
  });

  return (
    <main class={styles.main}>
      <h1>はじめる</h1>
      {status.value.state === "guest" ? (
        <>
          <p>このサービスを使うにはGoogleアカウントが必要です。</p>
          <AuthForm action={signIn}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/signup" />
            <button type="submit">Googleアカウントではじめる</button>
          </AuthForm>
        </>
      ) : (
        <Form class={styles.form}>
          <Field name="publicId">
            {(field, props) => (
              <label class={styles.field}>
                <span>ID（英数字とアンダースコア、最大{PUBLIC_ID_MAX_LENGTH}文字）</span>
                <input
                  {...props}
                  type="text"
                  value={field.value}
                  maxLength={PUBLIC_ID_MAX_LENGTH}
                  required
                />
                {field.error && <span class={styles.error}>{field.error}</span>}
              </label>
            )}
          </Field>
          <Field name="name">
            {(field, props) => (
              <label class={styles.field}>
                <span>名前（最大{NAME_MAX_LENGTH}文字）</span>
                <input
                  {...props}
                  type="text"
                  value={field.value}
                  maxLength={NAME_MAX_LENGTH}
                  required
                />
                {field.error && <span class={styles.error}>{field.error}</span>}
              </label>
            )}
          </Field>
          {signupForm.response.status === "error" && signupForm.response.message && (
            <p class={styles.error}>{signupForm.response.message}</p>
          )}
          <button type="submit" disabled={signupForm.submitting}>
            {signupForm.submitting ? "処理中…" : "はじめる"}
          </button>
        </Form>
      )}
    </main>
  );
});

export const head: DocumentHead = {
  title: "はじめる | Oheya",
  meta: [{ name: "description", content: "Oheyaのユーザー登録ページ" }],
};

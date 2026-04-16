import { component$ } from "@builder.io/qwik";
import type { Session } from "@auth/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form as AuthForm, routeLoader$ } from "@builder.io/qwik-city";
import {
  FormError,
  type InitialValues,
  formAction$,
  useForm,
  valiForm$,
} from "@modular-forms/qwik";
import * as v from "valibot";
import { useSignIn } from "~/routes/plugin@auth";
import { getPublicIdByEmail, registerProfile } from "~/server/user";
import styles from "./index.module.css";

type ProfileStatus = { state: "guest" | "needsProfile" };

const PUBLIC_ID_MAX_LENGTH = 16;
const NAME_MAX_LENGTH = 32;

const SignupSchema = v.object({
  publicId: v.pipe(
    v.string(),
    v.regex(/^[A-Za-z0-9_]+$/, "英数字とアンダースコアだけが使えます"),
    v.maxLength(PUBLIC_ID_MAX_LENGTH, `最大${PUBLIC_ID_MAX_LENGTH}文字です`),
  ),
  name: v.pipe(
    v.string(),
    v.minLength(1, "名前を入力してください"),
    v.maxLength(NAME_MAX_LENGTH, `最大${NAME_MAX_LENGTH}文字です`),
  ),
});

type SignupForm = v.InferInput<typeof SignupSchema>;

export const useProfileStatus = routeLoader$<ProfileStatus>(async (ev) => {
  const session = ev.sharedMap.get("session") as Session | null;
  if (!session?.user?.email) return { state: "guest" };

  const publicId = await getPublicIdByEmail(ev.platform.env, session.user.email);
  if (publicId) throw ev.redirect(302, "/");
  return { state: "needsProfile" };
});

export const useFormLoader = routeLoader$<InitialValues<SignupForm>>(() => ({
  publicId: "",
  name: "",
}));

export const useRegisterProfile = formAction$<SignupForm>(async (values, ev) => {
  const session = ev.sharedMap.get("session") as Session | null;
  if (!session?.user?.email) {
    throw new FormError<SignupForm>("ログインが必要です");
  }

  const result = await registerProfile(ev.platform.env, session.user.email, {
    publicId: values.publicId,
    name: values.name,
  });
  if (result === "duplicate_public_id") {
    throw new FormError<SignupForm>({ publicId: "このIDはすでに誰かが使っています" });
  }

  throw ev.redirect(302, "/");
}, valiForm$(SignupSchema));

export default component$(() => {
  const status = useProfileStatus();
  const signIn = useSignIn();
  const [signupForm, { Form, Field }] = useForm<SignupForm>({
    loader: useFormLoader(),
    action: useRegisterProfile(),
    validate: valiForm$(SignupSchema),
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

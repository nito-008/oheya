import { component$ } from "@builder.io/qwik";
import type { Session } from "@auth/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$, z, zod$ } from "@builder.io/qwik-city";
import { useSignIn } from "~/routes/plugin@auth";
import { isDbConfigured } from "~/server/infra/db";
import { getPublicIdByEmail, registerProfile } from "~/server/user";

type ProfileStatus = { state: "guest" | "needsProfile" };

export const useProfileStatus = routeLoader$<ProfileStatus>(async (ev) => {
  const session = ev.sharedMap.get("session") as Session | null;
  if (!session?.user?.email) return { state: "guest" };
  if (!isDbConfigured(ev)) return { state: "guest" };

  const publicId = await getPublicIdByEmail(ev.platform.env, session.user.email);
  if (publicId) throw ev.redirect(302, "/");
  return { state: "needsProfile" };
});

export const useRegisterProfile = routeAction$(
  async (data, ev) => {
    const session = ev.sharedMap.get("session") as Session | null;
    if (!session?.user?.email) {
      return ev.fail(401, { formErrors: ["ログインが必要です"] });
    }
    if (!isDbConfigured(ev)) {
      return ev.fail(500, { formErrors: ["サーバーエラー"] });
    }

    const result = await registerProfile(ev.platform.env, session.user.email, {
      publicId: data.publicId,
      name: data.name,
    });
    if (result === "duplicate_public_id") {
      return ev.fail(409, { formErrors: ["このIDはもう誰かが使っています"] });
    }

    throw ev.redirect(302, "/");
  },
  zod$({
    publicId: z
      .string()
      .regex(/^[A-Za-z0-9_]+$/, "英数字とアンダースコアだけが使えます")
      .max(16, "最大16文字です"),
    name: z.string().min(1, "名前を入力してください").max(32, "最大32文字です"),
  }),
);

export default component$(() => {
  const status = useProfileStatus();
  const signIn = useSignIn();
  const register = useRegisterProfile();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>はじめる</h1>
      {status.value.state === "guest" ? (
        <>
          <p>このサービスを使うにはGoogleアカウントが必要です。</p>
          <Form action={signIn}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/signup" />
            <button type="submit">Googleアカウントではじめる</button>
          </Form>
        </>
      ) : (
        <Form
          action={register}
          style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "20rem" }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span>ID（英数字とアンダースコア、最大16文字）</span>
            <input type="text" name="publicId" maxLength={16} required />
            {register.value?.failed && register.value.fieldErrors?.publicId && (
              <span style={{ color: "red" }}>{register.value.fieldErrors.publicId}</span>
            )}
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span>名前（最大32文字）</span>
            <input type="text" name="name" maxLength={32} required />
            {register.value?.failed && register.value.fieldErrors?.name && (
              <span style={{ color: "red" }}>{register.value.fieldErrors.name}</span>
            )}
          </label>
          {register.value?.failed &&
            register.value.formErrors &&
            register.value.formErrors.length > 0 && (
              <ul style={{ color: "red", margin: 0, paddingLeft: "1rem" }}>
                {register.value.formErrors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
          <button type="submit">はじめる</button>
        </Form>
      )}
    </main>
  );
});

export const head: DocumentHead = {
  title: "はじめる | Oheya",
  meta: [{ name: "description", content: "Oheyaのユーザー登録ページ" }],
};

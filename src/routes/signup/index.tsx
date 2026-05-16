import { $, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form as QwikForm, routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { FormError, getValue, type InitialValues, useForm, valiForm$ } from "@modular-forms/qwik";
import type * as v from "valibot";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import { FormTextInput } from "~/components/ui/form/form-text-input/form-text-input";
import { IconCropInput } from "~/components/ui/form/icon-crop-input/icon-crop-input";
import { createApiClient } from "~/lib/api";
import { useSignOut } from "~/routes/plugin@auth";
import { AlbumSettingsForm } from "~/routes/settings/album/components/album-settings-form";
import { MusicSettingsForm } from "~/routes/settings/music/components/music-settings-form";
import type { UserAlbumPhoto } from "~/schema/album";
import type { MusicTrack } from "~/schema/music";
import { NAME_MAX_LENGTH, PUBLIC_ID_MAX_LENGTH, userSchema } from "~/schema/user";
import styles from "./index.module.css";

type SignupForm = v.InferInput<typeof userSchema>;
type SignupStep = "profile" | "music" | "album";
type SignupProfile = { publicId: string };
type SignupStatus = {
  albumPhotos: UserAlbumPhoto[];
  musicTrack: MusicTrack | null;
  profile: SignupProfile | null;
  step: SignupStep;
};

const mediaSignupSteps = new Set<SignupStep>(["music", "album"]);

const getSignupPath = (step: SignupStep): string =>
  step === "profile" ? "/signup/" : `/signup/?step=${step}`;

const getSignupStep = (url: URL): SignupStep => {
  const step = url.searchParams.get("step");
  return step === "music" || step === "album" ? step : "profile";
};

export const useProfileStatus = routeLoader$<SignupStatus>(async (event) => {
  const client = createApiClient(event);
  const step = getSignupStep(event.url);
  const res = await client.api.users.me.$get();
  if (res.ok) {
    const profile = await res.json();
    if (!mediaSignupSteps.has(step)) {
      throw event.redirect(302, `/${profile.publicId}/`);
    }

    const [musicRes, albumRes] = await Promise.all([
      client.api.users.me.music.$get(),
      client.api.users.me.album.$get(),
    ]);
    if (!musicRes.ok) throw new Error("音楽設定の取得に失敗しました");
    if (!albumRes.ok) throw new Error("アルバム設定の取得に失敗しました");

    const music = (await musicRes.json()) as { track: MusicTrack | null };
    const album = (await albumRes.json()) as { photos: UserAlbumPhoto[] };

    return {
      albumPhotos: album.photos,
      musicTrack: music.track,
      profile: { publicId: profile.publicId },
      step,
    };
  }
  if (res.status === 401) throw event.redirect(302, "/");
  if (res.status === 404) {
    return { albumPhotos: [], musicTrack: null, profile: null, step: "profile" };
  }
  throw new Error("プロフィールを取得できませんでした");
});

export const useFormLoader = routeLoader$<InitialValues<SignupForm>>(() => ({
  publicId: "",
  name: "",
  icon: "",
}));

export default component$(() => {
  const profileStatus = useProfileStatus();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const currentStep = useSignal<SignupStep>(profileStatus.value.step);
  const publicId = useSignal(profileStatus.value.profile?.publicId ?? "");
  const [signupForm, { Form: SignupFormElement, Field }] = useForm<SignupForm>({
    loader: useFormLoader(),
    validate: valiForm$(userSchema),
  });
  const publicIdValue = getValue(signupForm, "publicId") ?? "";
  const nameValue = getValue(signupForm, "name") ?? "";
  const canSubmitProfile = publicIdValue.trim().length > 0 && nameValue.trim().length > 0;

  const goToStep$ = $(async (step: SignupStep) => {
    currentStep.value = step;
    await navigate(getSignupPath(step), { replaceState: true });
  });

  const finishSignup$ = $(async () => {
    if (!publicId.value) return;
    await navigate(`/${publicId.value}/`);
  });

  return (
    <main class={styles.main}>
      {currentStep.value === "profile" && (
        <>
          <h1>アカウント登録</h1>
          <SignupFormElement
            class={styles.form}
            onSubmit$={async (values, event) => {
              const form = event.target as HTMLFormElement;
              const iconImage = new FormData(form).get("iconImage");
              let uploadedIcon: string | null = null;

              if (iconImage instanceof File && iconImage.size > 0) {
                const imageFormData = new FormData();
                imageFormData.set("image", iconImage, iconImage.name);
                const uploadRes = await fetch("/api/images", {
                  method: "POST",
                  body: imageFormData,
                });
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

              publicId.value = values.publicId;
              await goToStep$("music");
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
                {(field, props) => (
                  <IconCropInput label="アイコン" field={field} fieldProps={props} />
                )}
              </Field>
              {signupForm.response.status === "error" && signupForm.response.message && (
                <FormErrorMessage message={signupForm.response.message} />
              )}
            </div>
            <div class={styles.actions}>
              <FormButton
                type="submit"
                variant="accent"
                size="md"
                width="full"
                disabled={signupForm.submitting || !canSubmitProfile}
                aria-busy={signupForm.submitting}
              >
                {signupForm.submitting ? "登録中..." : "はじめる"}
              </FormButton>
            </div>
          </SignupFormElement>
          <QwikForm action={signOut} class={styles.cancelForm}>
            <input type="hidden" name="redirectTo" value="/" />
            <button class={styles.cancelLink} type="submit">
              アカウント登録をやめる
            </button>
          </QwikForm>
        </>
      )}
      {currentStep.value === "music" && (
        <>
          <h1>音楽を設定</h1>
          <MusicSettingsForm
            initialTrack={profileStatus.value.musicTrack}
            saveOnSelect={false}
            onNext$={$(() => goToStep$("album"))}
          />
        </>
      )}
      {currentStep.value === "album" && (
        <>
          <h1>アルバムを設定</h1>
          <AlbumSettingsForm
            initialPhotos={profileStatus.value.albumPhotos}
            saveOnEdit={false}
            onNext$={finishSignup$}
          />
        </>
      )}
    </main>
  );
});

export const head: DocumentHead = {
  title: "アカウント登録 | Oheya",
  meta: [{ name: "description", content: "Oheyaのアカウント登録ページ" }],
};

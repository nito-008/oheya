import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import { getImageUrl } from "~/schema/image";
import styles from "./index.module.css";

export const useProfile = routeLoader$(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users[":publicId"].$get({
    param: { publicId: event.params.userId },
  });

  if (res.status === 404) {
    throw event.error(404, "部屋が見つかりません");
  }

  if (!res.ok) {
    throw new Error("プロフィールを取得できませんでした");
  }

  return res.json();
});

export default component$(() => {
  const profile = useProfile();

  return (
    <main class={styles.main}>
      <div class={styles.profileHeader}>
        <span class={styles.icon}>
          {profile.value.icon ? (
            <img
              src={getImageUrl(profile.value.icon) ?? ""}
              alt={`${profile.value.name}のアイコン`}
              width={96}
              height={96}
              class={styles.iconImage}
            />
          ) : (
            <img
              aria-hidden="true"
              src={iconPlaceholderSvg}
              alt=""
              width={96}
              height={96}
              class={styles.iconPlaceholder}
            />
          )}
          <img
            aria-hidden="true"
            src={iconFrameSvg}
            alt=""
            width={96}
            height={96}
            class={styles.iconFrame}
          />
        </span>
        <h1 class={styles.name}>{profile.value.name}</h1>
      </div>
      <dl>
        <dt>public_id</dt>
        <dd>{profile.value.publicId}</dd>
        <dt>name</dt>
        <dd>{profile.value.name}</dd>
      </dl>
    </main>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const profile = resolveValue(useProfile);

  return {
    title: `${profile.name} | Oheya`,
    meta: [{ name: "description", content: `${profile.name}のお部屋` }],
  };
};

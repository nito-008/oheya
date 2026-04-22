import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import { getImageUrl } from "~/schema/image";

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
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        {profile.value.icon ? (
          <img
            src={getImageUrl(profile.value.icon) ?? ""}
            alt={`${profile.value.name}のアイコン`}
            width={96}
            height={96}
            style={{
              width: "6rem",
              height: "6rem",
              border: "2px solid #2f2f2f",
              borderRadius: "999px",
              objectFit: "cover",
              background: "#fffef8",
            }}
          />
        ) : (
          <img
            aria-hidden="true"
            src={iconPlaceholderSvg}
            alt=""
            width={96}
            height={96}
            style={{
              width: "6rem",
              height: "6rem",
              border: "2px solid #2f2f2f",
              borderRadius: "999px",
              background: "#fffef8",
              boxSizing: "border-box",
              objectFit: "contain",
              padding: "1.1rem",
            }}
          />
        )}
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 400 }}>{profile.value.name}</h1>
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

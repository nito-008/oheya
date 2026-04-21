import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { createApiClient } from "~/lib/api";

export const useProfile = routeLoader$(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users[":publicId"].$get({
    param: { publicId: event.params.userId },
  });

  if (res.status === 404) {
    throw event.error(404, "部屋が見つかりません");
  }

  if (!res.ok) {
    throw new Error("プロフィールの取得に失敗しました");
  }

  return res.json();
});

export default component$(() => {
  const profile = useProfile();

  return (
    <main style={{ padding: "2rem" }}>
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

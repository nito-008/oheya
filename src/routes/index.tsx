import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { Introduction } from "~/components/introduction/introduction";
import { Door } from "~/components/svg/door/door";
import { createApiClient } from "~/lib/api";
import styles from "./index.module.css";

export const useRandomRoomHref = routeLoader$<string | null>(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.random.$get();

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("ランダムなお部屋の取得に失敗しました");
  }

  const { publicId } = await res.json();
  return `/${publicId}/`;
});

export default component$(() => {
  const randomRoomHref = useRandomRoomHref();

  return (
    <div class={styles.home}>
      <Introduction />
      <Door href={randomRoomHref.value ?? undefined} />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Oheya",
  meta: [{ name: "description", content: "インターネットのどこかにある、誰かのお部屋" }],
};

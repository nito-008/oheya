import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import {
  clearCommonHeaderUser,
  useCommonHeaderUser,
} from "~/components/common-header/common-header-state";
import { useToast } from "~/components/ui/toast/toast";
import { createApiClient } from "~/lib/api";
import deleteSvg from "~/media/icons/delete.svg?raw";
import { useSignOut } from "~/routes/plugin@auth";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import styles from "./index.module.css";

export const useAccountDeleteLoader = routeLoader$(async (event) => {
  const client = createApiClient(event);
  const res = await client.api.users.me.$get();

  if (res.status === 401) throw event.redirect(302, "/");
  if (res.status === 404) throw event.redirect(302, "/signup/");
  if (!res.ok) throw new Error("アカウント情報の読み込みに失敗しました");

  return {};
});

export default component$(() => {
  useAccountDeleteLoader();
  const deleting = useSignal(false);
  const toast = useToast();
  const signOut = useSignOut();
  const headerUser = useCommonHeaderUser();

  return (
    <section class={`${sharedStyles.content} ${styles.panel}`}>
      <p class={styles.warning}>
        アカウントを削除すると関連するすべてのデータが削除されます。この操作は取り消せません。
      </p>
      <div class={styles.actionRow}>
        <Button
          type="button"
          label={deleting.value ? "削除中..." : "アカウントを削除する"}
          disabled={deleting.value}
          aria-busy={deleting.value}
          onClick$={async () => {
            if (!confirm("本当にアカウントを削除しますか？この操作は取り消せません。")) {
              return;
            }

            deleting.value = true;
            try {
              const res = await fetch("/api/users/me", { method: "DELETE" });
              if (res.status === 401) {
                throw new Error("ログインが必要です");
              }
              if (!res.ok) {
                throw new Error("アカウントの削除に失敗しました");
              }

              clearCommonHeaderUser(headerUser);
              await toast.success("アカウントを削除しました");
              await signOut.submit({ redirectTo: "/" });
            } catch (error) {
              deleting.value = false;
              await toast.error(
                error instanceof Error ? error.message : "アカウントの削除に失敗しました",
              );
            }
          }}
        >
          <span class={styles.deleteIcon} dangerouslySetInnerHTML={deleteSvg} />
        </Button>
      </div>
      <Link class={styles.backLink} href="/settings/account/">
        やっぱりやめる
      </Link>
    </section>
  );
});

export const head: DocumentHead = {
  title: "アカウント削除 | Oheya",
  meta: [{ name: "description", content: "Oheyaのアカウント削除ページ" }],
};

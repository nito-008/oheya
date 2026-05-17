import { component$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog/confirm-dialog";
import logoutSvg from "~/media/icons/logout.svg";
import { useSignOut } from "~/routes/plugin@auth";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import styles from "./account-settings-panel.module.css";

type AccountSettingsPanelProps = {
  name: string;
};

export const AccountSettingsPanel = component$<AccountSettingsPanelProps>(() => {
  const signOut = useSignOut();
  const logoutConfirmOpen = useSignal(false);

  return (
    <section class={`${sharedStyles.content} ${styles.panel}`}>
      <div class={styles.section}>
        <h2>ログアウト</h2>
        <div class={styles.actionRow}>
          <Button
            type="button"
            label="ログアウト"
            onClick$={() => {
              logoutConfirmOpen.value = true;
            }}
          >
            <img src={logoutSvg} alt="" width={24} height={24} />
          </Button>
          <ConfirmDialog
            open={logoutConfirmOpen.value}
            title="ログアウトしますか？"
            message="現在のアカウントからログアウトします。"
            confirmLabel="ログアウト"
            onClose$={() => {
              logoutConfirmOpen.value = false;
            }}
            onConfirm$={async () => {
              await signOut.submit({ redirectTo: "/" });
            }}
          />
        </div>
      </div>
      <div class={styles.section}>
        <h2>アカウントの削除</h2>
        <div class={styles.actionRow}>
          <Link class={styles.deleteLink} href="/settings/account/delete/">
            アカウント削除へ
          </Link>
        </div>
      </div>
    </section>
  );
});

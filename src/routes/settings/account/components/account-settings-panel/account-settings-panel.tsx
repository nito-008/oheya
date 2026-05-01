import { component$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import logoutSvg from "~/media/icons/logout.svg";
import { useSignOut } from "~/routes/plugin@auth";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import styles from "./account-settings-panel.module.css";

type AccountSettingsPanelProps = {
  name: string;
};

export const AccountSettingsPanel = component$<AccountSettingsPanelProps>(() => {
  const signOut = useSignOut();

  return (
    <section class={`${sharedStyles.content} ${styles.panel}`}>
      <div class={styles.section}>
        <h2>ログアウト</h2>
        <Form action={signOut} class={styles.signOutForm}>
          <input type="hidden" name="redirectTo" value="/" />
          <Button type="submit" label="ログアウトする">
            <img src={logoutSvg} alt="" width={24} height={24} />
          </Button>
        </Form>
      </div>
    </section>
  );
});

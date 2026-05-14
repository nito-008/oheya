import { component$, Slot } from "@builder.io/qwik";
import { SettingsTabs } from "~/routes/settings/components/settings-tabs/settings-tabs";
import styles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";

export default component$(() => {
  return (
    <div class={styles.settingsMain}>
      <header class={styles.settingsHeader}>
        <h1>設定</h1>
        <SettingsTabs />
      </header>
      <Slot />
    </div>
  );
});

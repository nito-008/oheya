import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import styles from "./settings-tabs.module.css";

const tabs = [
  { href: "/settings/profile/", label: "プロフィール" },
  { href: "/settings/music/", label: "音楽" },
  { href: "/settings/album/", label: "アルバム" },
  { href: "/settings/account/", label: "アカウント" },
] as const;

export const SettingsTabs = component$(() => {
  const location = useLocation();

  return (
    <nav class={styles.tabList} aria-label="設定タブ">
      {tabs.map((tab) => {
        const isActive = location.url.pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            class={{
              [styles.tabLink]: true,
              [styles.tabLinkActive]: isActive,
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
});

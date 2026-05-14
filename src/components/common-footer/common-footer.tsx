import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { useSignIn, useSignOut } from "~/routes/plugin@auth";
import { getImageUrl } from "~/schema/image";
import type { CommonHeaderUser } from "~/components/common-header/common-header-state";
import styles from "./common-footer.module.css";

type CommonFooterProps = {
  user: CommonHeaderUser;
  showAuthActions?: boolean;
};

export const CommonFooter = component$<CommonFooterProps>(({ user, showAuthActions = true }) => {
  const signIn = useSignIn();
  const signOut = useSignOut();
  const isAuthenticated = showAuthActions && user.authenticated;
  const myRoomHref = user.publicId ? `/${user.publicId}/` : "/settings/profile/";
  const accountName = user.name?.trim() || "アカウント";
  const accountInitial = accountName.slice(0, 1).toUpperCase();

  return (
    <footer class={styles.footer}>
      <nav class={styles.nav} aria-label="フッター">
        {isAuthenticated ? (
          <Link href={myRoomHref} class={styles.profileLink}>
            {user.icon ? (
              <img
                class={styles.profileIcon}
                src={getImageUrl(user.icon) ?? ""}
                alt=""
                width={48}
                height={48}
              />
            ) : (
              <span class={styles.profileIconFallback} aria-hidden="true">
                {accountInitial}
              </span>
            )}
            <span class={styles.profileName}>{accountName}</span>
          </Link>
        ) : null}
        {isAuthenticated ? (
          <Form action={signOut} class={styles.form}>
            <input type="hidden" name="redirectTo" value="/" />
            <button class={styles.link} type="submit">
              ログアウト
            </button>
          </Form>
        ) : null}
        {!user.authenticated && showAuthActions ? (
          <Form action={signIn} class={styles.form}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/signup" />
            <button class={styles.link} type="submit">
              ログイン
            </button>
          </Form>
        ) : null}
        <Link href="/" class={styles.link}>
          ホーム
        </Link>
      </nav>
    </footer>
  );
});

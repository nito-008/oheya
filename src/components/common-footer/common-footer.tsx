import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { useSignIn, useSignOut } from "~/routes/plugin@auth";
import { getImageUrl } from "~/schema/image";
import {
  getCommonUserDisplayName,
  getCommonUserInitial,
  getCommonUserRoomHref,
  type CommonHeaderUser,
} from "~/components/common-header/common-header-state";
import styles from "./common-footer.module.css";

type CommonFooterProps = {
  user: CommonHeaderUser;
  showAuthActions?: boolean;
};

export const CommonFooter = component$<CommonFooterProps>(({ user, showAuthActions = true }) => {
  const signIn = useSignIn();
  const signOut = useSignOut();
  const hasProfile = showAuthActions && user.authenticated && Boolean(user.publicId);
  const myRoomHref = getCommonUserRoomHref(user);
  const accountName = getCommonUserDisplayName(user);
  const accountInitial = getCommonUserInitial(user);

  return (
    <footer class={styles.footer}>
      <nav class={styles.nav} aria-label="フッター">
        {hasProfile ? (
          <Link href={myRoomHref} prefetch="js" class={styles.profileLink}>
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
        {user.authenticated ? (
          <button
            class={styles.link}
            type="button"
            onClick$={async () => {
              if (!confirm("ログアウトしますか？")) return;
              await signOut.submit({ redirectTo: "/" });
            }}
          >
            ログアウト
          </button>
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

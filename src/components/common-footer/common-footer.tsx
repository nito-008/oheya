import { component$, useSignal } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { ConfirmDialog } from "~/components/ui/confirm-dialog/confirm-dialog";
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
  const hasProfile = user.authenticated && Boolean(user.publicId);
  const myRoomHref = getCommonUserRoomHref(user);
  const accountName = getCommonUserDisplayName(user);
  const accountInitial = getCommonUserInitial(user);
  const logoutConfirmOpen = useSignal(false);

  return (
    <footer class={styles.footer}>
      <nav class={styles.nav} aria-label="フッター">
        {showAuthActions && hasProfile ? (
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
        {user.authenticated && hasProfile && showAuthActions ? (
          <button
            class={styles.link}
            type="button"
            onClick$={() => {
              logoutConfirmOpen.value = true;
            }}
          >
            ログアウト
          </button>
        ) : null}
        {user.authenticated && !hasProfile && showAuthActions ? (
          <Link href="/signup/" class={styles.link}>
            アカウント登録
          </Link>
        ) : null}
        {!user.authenticated && showAuthActions ? (
          <Form action={signIn} class={styles.form}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/signup/" />
            <button class={styles.link} type="submit">
              ログイン
            </button>
          </Form>
        ) : null}
        <Link href="/" class={styles.link}>
          ホーム
        </Link>
      </nav>
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
    </footer>
  );
});

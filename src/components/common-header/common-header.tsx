import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import houseSvg from "~/media/house.svg";
import settingSvg from "~/media/icons/setting.svg";
import { useSignIn } from "~/routes/plugin@auth";
import { getImageUrl } from "~/schema/image";
import styles from "./common-header.module.css";

export type CommonHeaderUser = {
  authenticated: boolean;
  publicId: string | null;
  name: string | null;
  icon: string | null;
};

type CommonHeaderProps = {
  user: CommonHeaderUser;
  showAuthActions?: boolean;
};

export const CommonHeader = component$<CommonHeaderProps>(({ user, showAuthActions = true }) => {
  const signIn = useSignIn();
  const isAuthenticated = showAuthActions && user.authenticated;
  const myRoomHref = user.publicId ? `/${user.publicId}/` : "/settings/profile/";
  const accountName = user.name?.trim() || "アカウント";
  const accountInitial = accountName.slice(0, 1).toUpperCase();

  return (
    <header class={styles.header}>
      <h1 class={styles.heading}>
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
        ) : (
          <Link href="/" class={styles.titleLink}>
            <span>Oheya</span>
            <img class={styles.titleIcon} src={houseSvg} alt="" width={29} height={29} />
          </Link>
        )}
      </h1>
      {isAuthenticated ? (
        <Button href="/settings/profile/" label="設定">
          <img class={styles.settingsIcon} src={settingSvg} alt="" width={24} height={24} />
        </Button>
      ) : showAuthActions ? (
        <Form action={signIn} class={styles.authForm}>
          <input type="hidden" name="providerId" value="google" />
          <input type="hidden" name="options.redirectTo" value="/signup" />
          <button type="submit" class={styles.button}>
            ログイン
          </button>
        </Form>
      ) : null}
    </header>
  );
});

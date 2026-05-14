import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import houseSvg from "~/media/house.svg";
import loginSvg from "~/media/icons/login.svg";
import settingSvg from "~/media/icons/setting.svg";
import { useSignIn } from "~/routes/plugin@auth";
import { getImageUrl } from "~/schema/image";
import type { CommonHeaderUser } from "./common-header-state";
import styles from "./common-header.module.css";

type CommonHeaderProps = {
  user: CommonHeaderUser;
  currentPath: string;
  showAuthActions?: boolean;
};

export const CommonHeader = component$<CommonHeaderProps>(
  ({ user, currentPath, showAuthActions = true }) => {
    const signIn = useSignIn();
    const isAuthenticated = showAuthActions && user.authenticated;
    const myRoomHref = user.publicId ? `/${user.publicId}/` : "/settings/profile/";
    const isMyRoomPath = user.publicId ? currentPath === `/${user.publicId}/` : false;
    const accountName = user.name?.trim() || "アカウント";
    const accountInitial = accountName.slice(0, 1).toUpperCase();

    return (
      <header class={styles.header}>
        <h1 class={styles.heading}>
          <Link href="/" class={styles.titleLink}>
            <span>Oheya</span>
            <img class={styles.titleIcon} src={houseSvg} alt="" width={29} height={29} />
          </Link>
        </h1>
        {isAuthenticated && isMyRoomPath ? (
          <Button href="/settings/profile/" label="設定">
            <img class={styles.settingsIcon} src={settingSvg} alt="" width={24} height={24} />
          </Button>
        ) : isAuthenticated ? (
          <Link href={myRoomHref} class={styles.accountLink}>
            {user.icon ? (
              <img
                class={styles.accountButtonIcon}
                src={getImageUrl(user.icon) ?? ""}
                alt=""
                width={48}
                height={48}
              />
            ) : (
              <span class={styles.accountButtonIconFallback}>{accountInitial}</span>
            )}
            <span class={styles.accountName}>{accountName}</span>
          </Link>
        ) : showAuthActions ? (
          <Form action={signIn} class={styles.authForm}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/signup" />
            <Button type="submit" label="ログイン">
              <img class={styles.loginIcon} src={loginSvg} alt="" width={24} height={24} />
            </Button>
          </Form>
        ) : null}
      </header>
    );
  },
);

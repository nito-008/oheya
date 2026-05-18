import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import houseSvg from "~/media/house.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import accountSvg from "~/media/icons/account.svg";
import loginSvg from "~/media/icons/login.svg";
import settingSvg from "~/media/icons/setting.svg";
import { useSignIn } from "~/routes/plugin@auth";
import { getImageUrl } from "~/schema/image";
import { getCommonUserRoomHref, type CommonHeaderUser } from "./common-header-state";
import styles from "./common-header.module.css";

type CommonHeaderProps = {
  user: CommonHeaderUser;
  currentPath: string;
  showAuthActions?: boolean;
};

export const CommonHeader = component$<CommonHeaderProps>(
  ({ user, currentPath, showAuthActions = true }) => {
    const signIn = useSignIn();
    const hasProfile = user.authenticated && Boolean(user.publicId);
    const showProfileActions = showAuthActions && hasProfile;
    const myRoomHref = getCommonUserRoomHref(user);
    const isMyRoomPath = user.publicId ? currentPath === `/${user.publicId}/` : false;

    return (
      <header class={styles.header}>
        <h1 class={styles.heading}>
          <Link href="/" class={styles.titleLink}>
            <span>Oheya</span>
            <img class={styles.titleIcon} src={houseSvg} alt="" width={29} height={29} />
          </Link>
        </h1>
        {showProfileActions && isMyRoomPath ? (
          <Button href="/settings/profile/" label="設定">
            <img class={styles.settingsIcon} src={settingSvg} alt="" width={24} height={24} />
          </Button>
        ) : showProfileActions ? (
          <Link href={myRoomHref} prefetch="js" class={styles.accountLink}>
            {user.icon ? (
              <img
                class={styles.accountButtonIcon}
                src={getImageUrl(user.icon) ?? ""}
                alt=""
                width={48}
                height={48}
              />
            ) : (
              <span class={styles.accountButtonIconFallback} aria-hidden="true">
                <img
                  src={iconPlaceholderSvg}
                  alt=""
                  width={64}
                  height={64}
                  class={styles.accountButtonIconFallbackImage}
                />
              </span>
            )}
            <span class={styles.accountName}>自分の部屋へ</span>
          </Link>
        ) : user.authenticated && showAuthActions ? (
          <Button href="/signup/" label="アカウント登録">
            <img class={styles.accountIcon} src={accountSvg} alt="" width={24} height={24} />
          </Button>
        ) : showAuthActions ? (
          <Form action={signIn} class={styles.authForm}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/signup/" />
            <Button type="submit" label="ログイン">
              <img class={styles.loginIcon} src={loginSvg} alt="" width={24} height={24} />
            </Button>
          </Form>
        ) : null}
      </header>
    );
  },
);

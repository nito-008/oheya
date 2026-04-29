import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Form, Link, useLocation } from "@builder.io/qwik-city";
import houseSvg from "~/media/house.svg";
import logoutSvg from "~/media/icons/logout.svg";
import settingSvg from "~/media/icons/setting.svg";
import { useSignIn, useSignOut } from "~/routes/plugin@auth";
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
  const signOut = useSignOut();
  const location = useLocation();
  const menuOpen = useSignal(false);
  const closeMenu$ = $(() => {
    menuOpen.value = false;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => location.url.pathname);
    menuOpen.value = false;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => menuOpen.value);
    if (!menuOpen.value) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") menuOpen.value = false;
    };

    window.addEventListener("keydown", onKeyDown);

    cleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    });
  });

  return (
    <header class={styles.header}>
      <h1>
        <Link href="/" class={styles.titleLink}>
          <span>Oheya</span>
          <img class={styles.titleIcon} src={houseSvg} alt="" width={29} height={29} />
        </Link>
      </h1>
      {showAuthActions && user.authenticated ? (
        <>
          <button
            type="button"
            class={styles.menuButton}
            aria-expanded={menuOpen.value}
            aria-controls="common-header-menu"
            aria-label={menuOpen.value ? "メニューを閉じる" : "メニューを開く"}
            onClick$={() => {
              menuOpen.value = !menuOpen.value;
            }}
          >
            <span>{menuOpen.value ? "メニューを閉じる" : "メニュー"}</span>
          </button>
          {menuOpen.value && (
            <div
              id="common-header-menu"
              class={styles.menuOverlay}
              onClick$={async (event) => {
                if (event.target !== event.currentTarget) return;
                await closeMenu$();
              }}
            >
              <div class={styles.menuSurface}>
                <div class={styles.menuContent}>
                  {user.publicId && user.name && (
                    <Link href={`/${user.publicId}/`} class={styles.profileLink}>
                      {user.icon && (
                        <img
                          class={styles.userIcon}
                          src={getImageUrl(user.icon) ?? ""}
                          alt=""
                          width={56}
                          height={56}
                        />
                      )}
                      <span class={styles.profileLabel}>
                        <span class={styles.profileName}>{user.name}</span>
                        <span class={styles.profileMeta}>自分の部屋へ</span>
                      </span>
                    </Link>
                  )}
                  <div class={styles.actionBlock}>
                    <nav class={styles.actionList} aria-label="メニュー">
                      <Link href="/settings/profile/" class={styles.actionLink}>
                        <img
                          class={styles.actionIcon}
                          src={settingSvg}
                          alt=""
                          width={48}
                          height={48}
                        />
                        <span>設定</span>
                      </Link>
                    </nav>
                    <Form action={signOut} class={styles.signOutForm}>
                      <input type="hidden" name="redirectTo" value="/" />
                      <button
                        type="submit"
                        class={styles.actionButton}
                        onClick$={async () => {
                          await closeMenu$();
                        }}
                      >
                        <img
                          class={styles.actionIcon}
                          src={logoutSvg}
                          alt=""
                          width={48}
                          height={48}
                        />
                        <span>ログアウト</span>
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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

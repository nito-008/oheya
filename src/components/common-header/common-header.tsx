import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import houseSvg from "~/media/house.svg?raw";
import { useSignIn, useSignOut } from "~/routes/plugin@auth";
import styles from "./common-header.module.css";

export type CommonHeaderUser = {
  authenticated: boolean;
  name: string | null;
};

type CommonHeaderProps = {
  user: CommonHeaderUser;
  showAuthActions?: boolean;
};

export const CommonHeader = component$<CommonHeaderProps>(({ user, showAuthActions = true }) => {
  const signIn = useSignIn();
  const signOut = useSignOut();

  return (
    <header class={styles.header}>
      <h1>
        <Link href="/" class={styles.titleLink}>
          <span>Oheya</span>
          <span class={styles.titleIcon} aria-hidden="true" dangerouslySetInnerHTML={houseSvg} />
        </Link>
      </h1>
      {showAuthActions && user.authenticated ? (
        <>
          {user.name && <span>{user.name}</span>}
          <Form action={signOut}>
            <input type="hidden" name="redirectTo" value="/" />
            <button type="submit" class={styles.button}>
              ログアウト
            </button>
          </Form>
        </>
      ) : showAuthActions ? (
        <Form action={signIn}>
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

import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";
import styles from "./common-header.module.css";

export const CommonHeader = component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const signOut = useSignOut();

  return (
    <header class={styles.header}>
      <h1>
        <Link href="/" class={styles.titleLink}>
          Oheya
        </Link>
      </h1>
      {session.value?.user ? (
        <>
          <span>{session.value.user.name ?? session.value.user.email}</span>
          <Form action={signOut}>
            <input type="hidden" name="redirectTo" value="/" />
            <button type="submit" class={styles.button}>
              ログアウト
            </button>
          </Form>
        </>
      ) : (
        <Form action={signIn}>
          <input type="hidden" name="providerId" value="google" />
          <input type="hidden" name="options.redirectTo" value="/signup" />
          <button type="submit" class={styles.button}>
            ログイン
          </button>
        </Form>
      )}
    </header>
  );
});

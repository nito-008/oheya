import { component$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
import { QwikLogo } from "../icons/qwik";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";
import styles from "./header.module.css";

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const signOut = useSignOut();

  return (
    <header class={styles.header}>
      <div class={["container", styles.wrapper]}>
        <div class={styles.logo}>
          <a href="/" title="qwik">
            <QwikLogo height={50} width={143} />
          </a>
        </div>
        <ul>
          <li>
            <a href="/profile">Profile</a>
          </li>
          {session.value?.user ? (
            <>
              <li>
                <span>{session.value.user.name ?? session.value.user.email}</span>
              </li>
              <li>
                <Form action={signOut}>
                  <input type="hidden" name="redirectTo" value="/" />
                  <button type="submit">Sign Out</button>
                </Form>
              </li>
            </>
          ) : (
            <li>
              <Form action={signIn}>
                <input type="hidden" name="providerId" value="google" />
                <input type="hidden" name="options.redirectTo" value="/" />
                <button type="submit">Sign In</button>
              </Form>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
});

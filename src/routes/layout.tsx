import { component$, Slot } from "@builder.io/qwik";
import { Form, routeLoader$ } from "@builder.io/qwik-city";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: new Date().toISOString(),
  };
});

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const signOut = useSignOut();

  return (
    <>
      <header style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", padding: "1rem" }}>
        {session.value?.user ? (
          <>
            <span>{session.value.user.name ?? session.value.user.email}</span>
            <Form action={signOut}>
              <input type="hidden" name="redirectTo" value="/" />
              <button type="submit">Sign Out</button>
            </Form>
          </>
        ) : (
          <Form action={signIn}>
            <input type="hidden" name="providerId" value="google" />
            <input type="hidden" name="options.redirectTo" value="/" />
            <button type="submit">Sign In</button>
          </Form>
        )}
      </header>
      <main>
        <Slot />
      </main>
    </>
  );
});

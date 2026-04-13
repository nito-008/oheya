import { component$ } from "@builder.io/qwik";
import { Form, type DocumentHead, type RequestHandler } from "@builder.io/qwik-city";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";

export const onRequest: RequestHandler = (event) => {
  const session = event.sharedMap.get("session");
  if (!session?.user) {
    throw event.redirect(302, `/auth/signin?callbackUrl=${event.url.pathname}`);
  }
};

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const user = session.value?.user;

  return (
    <div class="container container-center">
      <h1>Profile</h1>
      {user ? (
        <>
          {user.image && <img src={user.image} alt="" width={80} height={80} />}
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <Form action={signOut}>
            <input type="hidden" name="redirectTo" value="/" />
            <button type="submit">Sign Out</button>
          </Form>
        </>
      ) : (
        <Form action={signIn}>
          <input type="hidden" name="providerId" value="google" />
          <input type="hidden" name="options.redirectTo" value="/profile" />
          <button type="submit">Sign In with Google</button>
        </Form>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Profile",
};

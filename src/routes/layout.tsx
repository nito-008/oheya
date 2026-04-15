import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { CommonHeader } from "~/components/common-header/common-header";

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: new Date().toISOString(),
  };
});

export default component$(() => {
  return (
    <>
      <CommonHeader />
      <main>
        <Slot />
      </main>
    </>
  );
});

import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

export const useSettingsIndexRedirect = routeLoader$((event) => {
  throw event.redirect(302, "/settings/profile/");
});

export default component$(() => null);

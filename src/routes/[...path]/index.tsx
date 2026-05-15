import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { ErrorPage } from "~/routes/components/error-page/error-page";

export const onGet: RequestHandler = (event) => {
  event.status(404);
};

export default component$(() => {
  return <ErrorPage message="ページが見つかりません" />;
});

export const head: DocumentHead = {
  title: "ページが見つかりません - Oheya",
};

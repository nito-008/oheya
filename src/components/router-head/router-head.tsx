import { useDocumentHead, useLocation, type DocumentMeta } from "@builder.io/qwik-city";

import { component$ } from "@builder.io/qwik";
import { QwikPartytown } from "~/components/partytown/partytown";

const SITE_NAME = "Oheya";
const DEFAULT_DESCRIPTION = "インターネットのどこかにある、誰かのお部屋";
const OGP_IMAGE_PATH = "/ogp.png";
const OGP_IMAGE_WIDTH = "1200";
const OGP_IMAGE_HEIGHT = "630";
const GA_MEASUREMENT_ID = "G-9TQQT768PQ";
const GA_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
const GA_INLINE_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());

  gtag('config', '${GA_MEASUREMENT_ID}');
`;

const getMetaContent = (meta: readonly DocumentMeta[], name: string) =>
  meta.find((item) => item.name === name)?.content;

const getMetaPropertyContent = (meta: readonly DocumentMeta[], property: string) =>
  meta.find((item) => "property" in item && item.property === property)?.content;

const managedMetaNames = new Set([
  "description",
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
]);
const managedMetaProperties = new Set([
  "og:site_name",
  "og:title",
  "og:description",
  "og:type",
  "og:url",
  "og:image",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "og:locale",
]);

const isManagedMeta = (meta: DocumentMeta) => {
  if (meta.name && managedMetaNames.has(meta.name)) return true;
  if ("property" in meta && meta.property && managedMetaProperties.has(meta.property)) return true;
  return false;
};

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();
  const headDescription = getMetaContent(head.meta, "description");
  const description = headDescription ?? DEFAULT_DESCRIPTION;
  const currentUrl = loc.url.href;
  const headOgpImage = getMetaPropertyContent(head.meta, "og:image");
  const ogpImageUrl = new URL(headOgpImage ?? OGP_IMAGE_PATH, loc.url).href;
  const headMeta = head.meta.filter((meta) => !isManagedMeta(meta));

  return (
    <>
      <title>{head.title}</title>

      <QwikPartytown forward={["gtag", "dataLayer.push"]} />
      <script async type="text/partytown" src={GA_SCRIPT_SRC}></script>
      <script type="text/partytown" dangerouslySetInnerHTML={GA_INLINE_SCRIPT}></script>
      <link rel="canonical" href={currentUrl} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={head.title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogpImageUrl} />
      <meta property="og:image:width" content={OGP_IMAGE_WIDTH} />
      <meta property="og:image:height" content={OGP_IMAGE_HEIGHT} />
      <meta property="og:image:alt" content={SITE_NAME} />
      <meta property="og:locale" content="ja_JP" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={head.title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogpImageUrl} />

      {headMeta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML ? {} : { dangerouslySetInnerHTML: s.style })}
        />
      ))}

      {head.scripts.map((s) => (
        <script
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML ? {} : { dangerouslySetInnerHTML: s.script })}
        />
      ))}
    </>
  );
});

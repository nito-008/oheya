# Qwik の方針

## ルーティング

- path は trailing slash 付きで扱う。
- `Link` の `href`、`window.location`、`history.replaceState` などで path を組み立てるときも trailing slash を付ける。
- 例:
  - `/settings/profile/`
  - `/${userId}/profile/`
  - `/${userId}/music/`

## Qwik 固有機能

- `Link`、`Form`、`routeLoader$`、`useLocation` などの Qwik / Qwik City 固有 API を使うときは、実装前にこのドキュメントを確認する。
- `useSignal`、`useVisibleTask$` などの `use**` 系 API を使うときも、既存実装との整合を優先する。

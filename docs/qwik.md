# Qwik Guidelines

## Routing

- Treat paths as trailing-slash paths.
- When building paths with `Link` `href`, `window.location`, `history.replaceState`, or similar APIs, include the trailing slash.
- Examples:
  - `/settings/profile/`
  - `/${userId}/profile/`
  - `/${userId}/music/`

## Qwik-Specific Features

- Review this document before using Qwik or Qwik City APIs such as `Link`, `Form`, `routeLoader$`, or `useLocation`.
- When using `use**` APIs such as `useSignal` or `useVisibleTask$`, prioritize consistency with the existing implementation patterns in the codebase.

## Writing

- Write documentation and comments in English by default, except for `README.md`.

## Commands

- Prefer `vp` commands instead of `npm` commands by default.

## Database

- After changing the database schema, perform these steps in order:
  1. Run `vp run db:generate`.
  2. Run `vp run db:migrate`.
  3. Run `vp run db:erd` and generate `docs/er.md`.

## References

- When adding a new document under `docs`, also add a corresponding reference here in `AGENTS.md` if future changes should consult it.
- Read `docs/contributing.md` before making Git commits or GitHub-related operations.
- Read `docs/css.md` before making CSS-related changes.
- Read `docs/design.md` before changing shared visual patterns or page-level layout treatments.
- Read `docs/error.md` before making error-related changes.
- Read `docs/form.md` before making form-related changes.
- Read `docs/hono.md` before adding or updating Hono routes.
- Read `docs/media.md` before adding or updating media assets such as SVG files.
- Read `docs/qwik.md` before using Qwik-specific features such as `routeLoader` and `use**` APIs.
- Read `docs/roughjs.md` before using RoughJS.

## Components

- Structure components in folders like `[component_name]/[component_name].{tsx,module.css}` by default.
- For route-specific components, create a `components` folder under each route and place them there.

## GitHub

- Use the GitHub CLI for GitHub-related operations.
- When addressing an issue, create a new branch and open a pull request for the change.
- Do not push commits unless the user explicitly asks you to push.

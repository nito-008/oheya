## Writing

- Write documentation and comments in English by default, except for `README.md`.

## Commands

- Prefer `vp` commands instead of `npm` commands by default.

## Database

- This is an experimental product. Do not preserve existing local data when the schema changes.
- When changing the database schema, recreate migration files from scratch instead of adding incremental migrations.
- After changing the database schema, perform these steps in order:
  1. Delete `local.db`.
  2. Delete `drizzle` (migration folder).
  3. Run `vp run db:generate`.
  4. Run `vp run db:migrate`.
- After updating the database, run `vp run db:erd` and generate `docs/er.md`.

## References

- When adding a new document under `docs`, also add a corresponding reference here in `AGENTS.md` if future changes should consult it.
- Read `docs/contributing.md` before making Git commits or GitHub-related operations.
- Read `docs/css.md` before making CSS-related changes.
- Read `docs/design.md` before changing shared visual patterns or page-level layout treatments.
- Read `docs/error.md` before making error-related changes.
- Read `docs/form.md` before making form-related changes.
- Read `docs/media.md` before adding or updating media assets such as SVG files.
- Read `docs/qwik.md` before using Qwik-specific features such as `routeLoader` and `use**` APIs.

## Components

- Structure components in folders like `[component_name]/[component_name].{tsx,module.css}` by default.
- For route-specific components, create a `components` folder under each route and place them there.

## GitHub

- When addressing an issue, create a new branch and open a pull request for the change.

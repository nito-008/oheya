## Writing

- Write documentation and comments in English by default, except for `README.md`.

## Commands

- Prefer `vp` commands instead of `npm` commands by default.

## Git

- Write commit messages in English.
- Use the `prefix: description` format, such as `fix: handle missing image owner`.
- Prefer including the reason for the change in the commit message when it is useful.
- Split commits by the prefix categories below so each commit is appropriately sized: not too large and not too small.
- Use these prefixes:
  - `feat`: new features
  - `fix`: bug fixes
  - `docs`: documentation-only changes
  - `style`: whitespace, formatting, semicolons, and other style-only changes
  - `refactor`: code improvements that do not affect behavior
  - `perf`: performance improvements
  - `test`: test-related changes
  - `chore`: build, auxiliary tooling, and library-related changes

## Database

- This is an experimental product. Do not preserve existing local data when the schema changes.
- When changing the database schema, recreate migration files from scratch instead of adding incremental migrations.
- After changing the database schema, perform these steps in order:
  1. Delete `local.db`.
  2. Delete existing migration files under `drizzle/`.
  3. Run `vp run db:generate`.
  4. Run `vp run db:migrate`.
- After updating the database, run `vp run db:erd` and generate `docs/er.md`.

## References

- When adding a new document under `docs`, also add a corresponding reference here in `AGENTS.md` if future changes should consult it.
- Read `docs/css.md` before making CSS-related changes.
- Read `docs/design.md` before changing shared visual patterns or page-level layout treatments.
- Read `docs/error.md` before making error-related changes.
- Read `docs/form.md` before making form-related changes.
- Read `docs/media.md` before adding or updating media assets such as SVG files.
- Read `docs/qwik.md` before using Qwik-specific features such as `routeLoader` and `use**` APIs.

## Components

- Structure components in folders like `[component_name]/[component_name].{tsx,module.css}` by default.
- For route-specific components, create a `components` folder under each route and place them there.

## Writing

- Write documentation and comments in English by default, except for `README.md`.

## Commands

- Prefer `vp` commands instead of `npm` commands by default.

## Database

- After updating the database, run `vp run db:erd` and generate `docs/er.md`.

## References

- Read `docs/css.md` before making CSS-related changes.
- Read `docs/qwik.md` before using Qwik-specific features such as `routeLoader` and `use**` APIs.

## Components

- Structure components in folders like `[component_name]/[component_name].{tsx,module.css}` by default.
- For route-specific components, create a `components` folder under each route and place them there.

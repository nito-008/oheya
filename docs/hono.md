# Hono Guidelines

## Route Files

- Keep one router per file.
- When a router starts owning nested endpoint paths such as `/me/music`, move it from `routes/<name>.ts` to `routes/<name>/`.
- In a route folder, use `index.ts` only to compose child routers and keep each child router in its own file.
- Put route-folder common types and constants, such as shared Hono env types and response payloads, in `index.ts` by default.
- Route folders should contain `index.ts`, `service.ts` when shared behavior exists, and the route files.

## Routes and Shared Logic

- Keep endpoint paths explicit in the router that owns them instead of hiding them inside a shared router.
- When routes share behavior, extract it into plain functions in `service.ts` near the router instead of creating a shared router.
- In `service.ts`, keep related constants, types, and helpers close to the function that uses them instead of grouping them all at the top.

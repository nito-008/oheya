# Hono Guidelines

## Route Files

- Keep one router per file.
- When a route group grows beyond a small single-purpose router, move it into a folder and use `index.ts` only to compose child routers.

## Routes and Shared Logic

- Keep endpoint paths explicit in the router that owns them instead of hiding them inside a shared router.
- Prefer a route chain that shows the public API shape directly, such as `.get("/")`, `.get("/music")`, or `.patch("/")`.
- Compose routers at boundary paths, such as `.route("/me", currentUserRouter)` and `.route("/:publicId", publicUserRouter)`.
- Share duplicated behavior with plain functions instead of shared routers when each route should still show its own path.
- Put data access and response-shaping helpers in `service.ts` near the router.
- Keep route handlers thin: read request data, call the service function, map missing data or validation failures to an HTTP response, and return the response.

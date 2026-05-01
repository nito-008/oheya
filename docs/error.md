# Writing Guidelines

## Error Messages

- Keep Hono endpoint response messages in English.
- Write frontend error messages in Japanese when they may be shown directly to users.
- Omit the trailing Japanese full stop `。` from frontend error messages unless there is a specific reason to include it.
- This includes UI text, `throw new Error(...)`, `FormError`, loader errors rendered by the app, and similar frontend-side messages.
- Do not expose raw internal errors, stack traces, or vendor-generated messages directly to users.
- Internal logs, debug output, and code comments may remain in English unless there is a specific reason to localize them.

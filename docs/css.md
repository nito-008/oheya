# CSS Guidelines

## Mobile Support

- Write CSS mobile-first.
- Do not use media queries when `min()`, `max()`, `clamp()`, `auto-fit`, or similar tools can handle responsive sizing naturally.
- Use `@media (min-width: 32rem)` only when the layout structure itself needs to change.

## Global CSS Variables

- `--ease-out-expo` is available globally.
- Use `var(--ease-out-expo)` for transition easing unless there is a specific reason not to.

## Length Units

- Use `rem` for lengths by default.
- Use `px` only when you need device-pixel precision, such as a `1px` border or shadow.

## Fonts

- Use the Uzura font by default. It is already configured on `html`.
- Use Caveat for titles.

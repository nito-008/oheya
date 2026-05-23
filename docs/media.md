# Media Guidelines

## SVG Assets

- Store reusable SVG assets under `src/media` instead of inlining the markup directly inside components.
- Use `src/media/icons` for small icon-style SVG assets.
- Inline SVG markup inside a component only when the implementation specifically requires component-local dynamic SVG structure.

## Usage

- Import SVG files from `src/media` and render them using the existing project patterns.
- If an SVG needs styling through `currentColor` or similar CSS-driven behavior, keep that behavior when moving the asset into `src/media`.
- Remove assets from `src/media` when they are no longer imported or used by generation scripts.

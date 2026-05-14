# RoughJS Guidelines

## Asset Generation

- Use `scripts/roughjs/roughjs-to-svg.ts` by default when using RoughJS.
- Generate static SVG files instead of rendering RoughJS directly in application components.
- Place generated SVG files under `src/media`, then import them from application code using the existing SVG import patterns.

## Draw Scripts

- Keep RoughJS drawing source files under `scripts/roughjs`.
- Export a default draw function from each drawing source file:

```ts
import type { RoughSVG } from "roughjs/bin/svg";

export default function draw(rc: RoughSVG, svg: SVGSVGElement, document: Document) {
  svg.appendChild(rc.rectangle(10, 10, 120, 80));

  return { width: 140, height: 100 };
}
```

- Return `width`, `height`, or `viewBox` metadata from the draw function when the default `800x600` output size is not appropriate.

## Usage

Run the generator with a RoughJS drawing source file and a target SVG path:

```sh
node scripts/roughjs/roughjs-to-svg.ts scripts/roughjs/example.ts src/media/example.svg
```

For existing assets, keep the drawing source file and generated SVG filename aligned when practical, for example:

```sh
node scripts/roughjs/roughjs-to-svg.ts scripts/roughjs/door.ts src/media/door.svg
```

After generating or updating an SVG, review `docs/media.md` and keep the asset reusable from `src/media`.

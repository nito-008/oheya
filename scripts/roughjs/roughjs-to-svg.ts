import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import rough from "roughjs";
import type { RoughSVG } from "roughjs/bin/svg";

type Meta = { width?: number; height?: number; viewBox?: string };
type DrawFn = (
  rc: RoughSVG,
  svg: SVGSVGElement,
  document: Document,
) => Meta | void | Promise<Meta | void>;

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/roughjs/roughjs-to-svg.ts <input.(ts|js)> <output.svg>");
  process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);
const outputPath = resolve(process.cwd(), outputArg);

const mod = (await import(pathToFileURL(inputPath).href)) as { default?: DrawFn };
const draw = mod.default;
if (typeof draw !== "function") {
  throw new Error(
    `${inputArg} must default-export a draw function: (rc, svg, document) => { width, height }`,
  );
}

const SVG_NS = "http://www.w3.org/2000/svg";
const dom = new JSDOM();
const { document, XMLSerializer } = dom.window;
const svg = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;

const rc = rough.svg(svg as unknown as SVGSVGElement);
const meta = (await draw(rc, svg, document as unknown as Document)) ?? {};
const width = meta.width ?? 800;
const height = meta.height ?? 600;

svg.setAttribute("width", String(width));
svg.setAttribute("height", String(height));
svg.setAttribute("viewBox", meta.viewBox ?? `0 0 ${width} ${height}`);

const xml = new XMLSerializer().serializeToString(svg);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `<?xml version="1.0" encoding="UTF-8"?>\n${xml}\n`);
console.log(`Wrote ${outputPath}`);

import { readFileSync } from "node:fs";
import type { RoughSVG } from "roughjs/bin/svg";

const ink = "#1e1e1e";

const chevronStyle = {
  stroke: ink,
  strokeWidth: 2,
  roughness: 1.5,
  bowing: 1.2,
  fill: "none",
};

const chevronWidth = 36;
const chevronHeight = 15;
const chevronGap = 9;
const chevronStep = chevronHeight + chevronGap;
const chevronStartY = 70;
const sourceSvgUrl = new URL("../../src/media/scroll-hint.svg", import.meta.url);

function getExcalifontFace() {
  const sourceSvg = readFileSync(sourceSvgUrl, "utf8");

  return sourceSvg.match(/@font-face \{[^}]+}/)?.[0] ?? null;
}

function appendFontDefs(svg: SVGSVGElement, document: Document) {
  const fontFace = getExcalifontFace();
  if (!fontFace) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.setAttribute("class", "style-fonts");
  style.textContent = `\n      ${fontFace}`;
  defs.appendChild(style);
  svg.appendChild(defs);
}

function appendChevron(
  rc: RoughSVG,
  svg: SVGSVGElement,
  centerX: number,
  y: number,
  width: number,
  height: number,
  seed: number,
) {
  const chevron = rc.path(
    `M ${centerX - width / 2} ${y} L ${centerX} ${y + height} L ${centerX + width / 2} ${y}`,
    { ...chevronStyle, seed },
  );
  if (chevron) svg.appendChild(chevron);
}

export default function draw(rc: RoughSVG, svg: SVGSVGElement, document: Document) {
  const width = 230.115954261272;
  const height = chevronStartY + chevronStep * 2 + chevronHeight + 2;
  const centerX = width / 2;

  appendFontDefs(svg, document);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.textContent = "scroll";
  label.setAttribute("x", "0");
  label.setAttribute("y", "41.30689429820514");
  label.setAttribute("font-family", "Excalifont, Xiaolai, sans-serif, Segoe UI Emoji");
  label.setAttribute("font-size", "46.886372642684606px");
  label.setAttribute("fill", "#1e1e1e");
  label.setAttribute("text-anchor", "start");
  label.setAttribute("style", "white-space: pre;");
  label.setAttribute("direction", "ltr");
  label.setAttribute("dominant-baseline", "alphabetic");

  const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroup.setAttribute(
    "transform",
    "translate(53.06412094243615 0) rotate(0 76.22042236453433 29.30398290167784)",
  );
  textGroup.appendChild(label);
  svg.appendChild(textGroup);

  [chevronStartY, chevronStartY + chevronStep, chevronStartY + chevronStep * 2].forEach(
    (y, index) => {
      appendChevron(rc, svg, centerX, y, chevronWidth, chevronHeight, 41 + index);
    },
  );

  return { width, height };
}

import type { RoughSVG } from "roughjs/bin/svg";

const SVG_NS = "http://www.w3.org/2000/svg";

const frameStyle = {
  stroke: "#222222",
  strokeWidth: 2.2,
  roughness: 1.45,
  bowing: 0.9,
  seed: 62,
};

const tapeStyle = {
  stroke: "#8d8074",
  strokeWidth: 1.7,
  roughness: 1.2,
  bowing: 0.8,
  fill: "#f5edd9",
  fillStyle: "hachure",
  hachureGap: 8,
  hachureAngle: -18,
  seed: 66,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement, document: Document) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };
  const appendRotated = (
    el: SVGElement | null,
    degrees: number,
    centerX: number,
    centerY: number,
  ) => {
    if (!el) return;
    el.setAttribute("transform", `rotate(${degrees} ${centerX} ${centerY})`);
    svg.appendChild(el);
  };
  const appendTape = (x: number, y: number, width: number, height: number, seed: number) => {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const backing = document.createElementNS(SVG_NS, "rect");
    backing.setAttribute("x", String(x));
    backing.setAttribute("y", String(y));
    backing.setAttribute("width", String(width));
    backing.setAttribute("height", String(height));
    backing.setAttribute("fill", "#f5edd9");
    backing.setAttribute("fill-opacity", "0.62");

    appendRotated(backing, -28, centerX, centerY);
    appendRotated(
      rc.rectangle(x, y, width, height, { ...tapeStyle, seed, hachureAngle: -18 }),
      -28,
      centerX,
      centerY,
    );
  };

  append(rc.rectangle(16, 16, 368, 268, frameStyle));
  append(rc.rectangle(34, 25.5, 332, 249, { ...frameStyle, seed: 63 }));

  appendTape(-10, 9, 82, 26, 66);
  appendTape(328, 261, 82, 26, 69);

  return { width: 480, height: 360, viewBox: "-40 -30 480 360" };
}

import type { RoughSVG } from "roughjs/bin/svg";

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

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  append(rc.rectangle(16, 16, 368, 268, frameStyle));
  append(rc.rectangle(34, 25.5, 332, 249, { ...frameStyle, seed: 63 }));
  append(rc.line(34, 25.5, 16, 16, { ...frameStyle, seed: 64 }));
  append(rc.line(366, 25.5, 384, 16, { ...frameStyle, seed: 65 }));
  append(rc.line(34, 274.5, 16, 284, { ...frameStyle, seed: 67 }));
  append(rc.line(366, 274.5, 384, 284, { ...frameStyle, seed: 68 }));

  append(rc.rectangle(29, 2, 74, 27, tapeStyle));
  append(rc.rectangle(297, 271, 74, 27, { ...tapeStyle, seed: 69, hachureAngle: -18 }));

  return { width: 400, height: 300 };
}

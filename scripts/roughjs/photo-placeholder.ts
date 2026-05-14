import type { RoughSVG } from "roughjs/bin/svg";

const outlineStyle = {
  stroke: "#222222",
  strokeWidth: 3.4,
  roughness: 0.8,
  bowing: 0.7,
  fill: "transparent",
  seed: 211,
};

const detailStyle = {
  ...outlineStyle,
  seed: 217,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  append(rc.rectangle(7, 11, 50, 40, outlineStyle));
  append(rc.circle(43, 23, 8, { ...detailStyle, seed: 223 }));
  append(rc.path("M 11 45 L 24 31 L 34 41 L 41 34 L 54 47", detailStyle));

  return { width: 64, height: 64 };
}

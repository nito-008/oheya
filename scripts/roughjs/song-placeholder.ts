import type { RoughSVG } from "roughjs/bin/svg";

const outlineStyle = {
  stroke: "#222222",
  strokeWidth: 3.4,
  roughness: 0.8,
  bowing: 0.7,
  fill: "transparent",
  seed: 241,
};

const detailStyle = {
  ...outlineStyle,
  seed: 247,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  append(rc.line(29, 11, 29, 41, detailStyle));
  append(rc.line(53, 11, 53, 44, { ...detailStyle, seed: 251 }));
  append(rc.line(29, 11, 53, 11, { ...detailStyle, seed: 257 }));
  append(rc.ellipse(20, 43, 18, 11, { ...detailStyle, seed: 263 }));
  append(rc.ellipse(44, 41, 18, 11, { ...detailStyle, seed: 269 }));

  return { width: 64, height: 64 };
}

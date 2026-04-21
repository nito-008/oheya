import type { RoughSVG } from "roughjs/bin/svg";

const style = {
  stroke: "#222222",
  strokeWidth: 3.4,
  roughness: 0.8,
  bowing: 0.7,
  fill: "transparent",
  seed: 37,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  append(rc.circle(32, 22, 24, style));
  append(rc.line(22, 35, 14, 56, style));
  append(rc.line(14, 56, 50, 56, style));
  append(rc.line(50, 56, 42, 35, style));

  return { width: 64, height: 64 };
}

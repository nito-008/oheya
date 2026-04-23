import type { RoughSVG } from "roughjs/bin/svg";

const iconStyle = {
  stroke: "#111111",
  strokeWidth: 5,
  fill: "#ffffff",
  fillStyle: "solid",
  roughness: 1.1,
  bowing: 0.8,
  seed: 85,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const mark = rc.path("M 15 8 L 44 28 L 15 48 Z", iconStyle);
  if (mark) svg.appendChild(mark);

  return { width: 56, height: 56 };
}

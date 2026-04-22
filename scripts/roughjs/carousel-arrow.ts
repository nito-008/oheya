import type { RoughSVG } from "roughjs/bin/svg";

const strokeStyle = {
  stroke: "#3b332d",
  strokeWidth: 4,
  roughness: 2.1,
  bowing: 1.8,
  seed: 19,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const mark = rc.path("M 42 10 L 16 32 L 42 54", strokeStyle);
  if (mark) svg.appendChild(mark);

  return { width: 60, height: 64 };
}

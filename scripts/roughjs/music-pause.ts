import type { RoughSVG } from "roughjs/bin/svg";

const iconStyle = {
  stroke: "#111111",
  strokeWidth: 4,
  fill: "#ffffff",
  fillStyle: "solid",
  roughness: 1,
  bowing: 0.7,
  seed: 91,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const left = rc.rectangle(13, 8, 10, 40, iconStyle);
  const right = rc.rectangle(33, 8, 10, 40, { ...iconStyle, seed: 92 });

  if (left) svg.appendChild(left);
  if (right) svg.appendChild(right);

  return { width: 56, height: 56 };
}

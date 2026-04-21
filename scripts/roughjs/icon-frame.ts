import type { RoughSVG } from "roughjs/bin/svg";

const frameStyle = {
  stroke: "#111111",
  strokeWidth: 3,
  roughness: 0.9,
  bowing: 0.6,
  seed: 43,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  append(rc.circle(64, 64, 112, frameStyle));

  return { width: 128, height: 128 };
}

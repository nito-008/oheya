import type { RoughSVG } from "roughjs/bin/svg";

const plusStyle = {
  stroke: "#111111",
  strokeWidth: 2,
  roughness: 0.9,
  bowing: 0.55,
  seed: 71,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  append(rc.line(12, 20, 35, 18, plusStyle));
  append(rc.line(20, 10, 18, 36, { ...plusStyle, seed: 72 }));

  return { width: 40, height: 40 };
}

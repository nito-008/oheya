import type { RoughSVG } from "roughjs/bin/svg";

const strokeStyle = {
  stroke: "#111111",
  strokeWidth: 2,
  roughness: 1.5,
  bowing: 1,
  seed: 42,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  // Original room frame, trimmed into a standalone song jacket frame asset.
  append(rc.rectangle(20, 60, 320, 320, { ...strokeStyle, strokeWidth: 3 }));
  append(rc.rectangle(42, 82, 276, 276, { ...strokeStyle, seed: 43 }));
  append(rc.line(20, 60, 180, 20, strokeStyle));
  append(rc.line(340, 60, 180, 20, strokeStyle));
  append(rc.circle(189, 9, 14, { ...strokeStyle, seed: 44 }));
  append(rc.line(185, 13, 173, 28, { ...strokeStyle, seed: 45 }));

  return { width: 360, height: 400 };
}

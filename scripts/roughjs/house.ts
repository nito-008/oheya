import type { RoughSVG } from "roughjs/bin/svg";

const style = {
  stroke: "#222222",
  strokeWidth: 3.6,
  roughness: 0.8,
  bowing: 0.7,
  fill: "transparent",
  seed: 29,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  // Keep the icon sparse so it stays legible at small sizes.
  append(rc.rectangle(42, 8, 8, 18, { ...style, strokeWidth: 3 }));

  append(
    rc.polygon(
      [
        [8, 32],
        [32, 10],
        [56, 32],
      ],
      style,
    ),
  );

  append(rc.rectangle(14, 31, 36, 25, style));
  append(rc.rectangle(22, 36, 20, 14, { ...style, strokeWidth: 3.2 }));
  append(rc.line(32, 36, 32, 50, { ...style, strokeWidth: 2.6 }));
  append(rc.line(22, 43, 42, 43, { ...style, strokeWidth: 2.6 }));

  return { width: 64, height: 64 };
}

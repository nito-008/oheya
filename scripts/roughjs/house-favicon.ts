import type { RoughSVG } from "roughjs/bin/svg";

const iconStyle = {
  stroke: "#222222",
  strokeWidth: 3.6,
  roughness: 0.8,
  bowing: 0.7,
  fill: "transparent",
  seed: 29,
};

const SVG_NS = "http://www.w3.org/2000/svg";

export default function draw(rc: RoughSVG, svg: SVGSVGElement, document: Document) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", "64");
  background.setAttribute("height", "64");
  background.setAttribute("rx", "18");
  background.setAttribute("fill", "#ffffff");
  svg.appendChild(background);

  append(rc.rectangle(42, 8, 8, 18, { ...iconStyle, strokeWidth: 3 }));

  append(
    rc.polygon(
      [
        [8, 32],
        [32, 10],
        [56, 32],
      ],
      iconStyle,
    ),
  );

  append(rc.rectangle(14, 31, 36, 25, iconStyle));
  append(rc.rectangle(22, 36, 20, 14, { ...iconStyle, strokeWidth: 3.2 }));
  append(rc.line(32, 36, 32, 50, { ...iconStyle, strokeWidth: 2.6 }));
  append(rc.line(22, 43, 42, 43, { ...iconStyle, strokeWidth: 2.6 }));

  return { width: 64, height: 64 };
}

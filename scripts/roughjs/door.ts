import type { RoughSVG } from "roughjs/bin/svg";

const style = {
  stroke: "#222222",
  strokeWidth: 2,
  roughness: 1.6,
  bowing: 1,
  fill: "transparent",
  seed: 17,
};

const SVG_NS = "http://www.w3.org/2000/svg";

export default function draw(rc: RoughSVG, svg: SVGSVGElement, document: Document) {
  const append = (parent: Element, el: SVGGElement | null) => {
    if (el) parent.appendChild(el);
  };
  const group = (id: string) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("id", id);
    svg.appendChild(g);
    return g;
  };

  // 1. 敷居 (床のライン) — 画面中央配置時にも端まで届くよう枠外まで伸ばす
  append(svg, rc.line(-2000, 410, 2260, 400, style));

  // 2. ドア枠 (外側, 静止)
  append(svg, rc.rectangle(30, 30, 200, 385, style));
  append(svg, rc.rectangle(45, 45, 170, 355, { ...style, roughness: 1.2 }));

  // 3. 蝶番 (枠側に残して扉と一緒に回転させない)
  append(svg, rc.rectangle(36, 80, 8, 20, { ...style, strokeWidth: 1.5 }));
  append(svg, rc.rectangle(36, 340, 8, 20, { ...style, strokeWidth: 1.5 }));

  // 4. 扉本体 (回転対象)
  const leaf = group("leaf");

  // 4a. 扉本体の下地 — 塗りは CSS (.leaf-bg) 側で制御
  const base = document.createElementNS(SVG_NS, "rect");
  base.setAttribute("x", "45");
  base.setAttribute("y", "45");
  base.setAttribute("width", "170");
  base.setAttribute("height", "355");
  base.setAttribute("class", "leaf-bg");
  leaf.appendChild(base);

  append(leaf, rc.rectangle(45, 45, 170, 355, { ...style, roughness: 1.2 }));
  append(leaf, rc.rectangle(60, 60, 140, 130, style));
  append(leaf, rc.rectangle(60, 210, 140, 175, style));
  append(leaf, rc.circle(180, 230, 14, { ...style, fill: "#e2c6ff", fillStyle: "solid" }));
  append(leaf, rc.circle(180, 230, 6, style));

  return { width: 260, height: 440 };
}

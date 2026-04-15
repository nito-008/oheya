import type { RoughSVG } from "roughjs/bin/svg";

const style = {
  stroke: "#222222",
  strokeWidth: 2,
  roughness: 1.5,
  bowing: 1,
  fill: "transparent",
  seed: 42,
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

  // 1. 本体のベース
  append(svg, rc.line(50, 150, 50, 400, style));
  append(svg, rc.line(50, 400, 250, 400, style));
  append(svg, rc.line(250, 400, 250, 150, style));
  append(svg, rc.arc(150, 150, 200, 150, Math.PI, 2 * Math.PI, false, style));

  // 2. ディスプレイ窓 (外周はアニメしないので静的)
  append(svg, rc.circle(150, 160, 130, style));

  // 3. レコード盤 (回転対象)
  const record = group("record");
  append(record, rc.circle(150, 160, 95, { ...style, roughness: 1 }));
  append(record, rc.circle(150, 160, 35, style));

  // 4. トーンアーム (回転対象, 基点は根本 (205,220))
  const arm = group("arm");
  append(arm, rc.line(200, 215, 155, 170, { ...style, strokeWidth: 3 }));
  append(arm, rc.circle(205, 220, 15, style));

  // 5. ボタン列
  const buttonStartX = 65;
  for (let i = 0; i < 6; i++) {
    append(svg, rc.rectangle(buttonStartX + i * 29, 240, 20, 12, style));
  }

  // 6. スピーカーのグリル
  append(svg, rc.rectangle(70, 275, 160, 105, style));
  const lineStartX = 90;
  for (let i = 0; i < 5; i++) {
    append(svg, rc.line(lineStartX + i * 30, 275, lineStartX + i * 30, 380, style));
  }

  return { width: 300, height: 430 };
}

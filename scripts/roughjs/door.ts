import type { RoughSVG } from "roughjs/bin/svg";

const style = {
  stroke: "#222222",
  strokeWidth: 2,
  roughness: 1.6,
  bowing: 1,
  fill: "transparent",
  seed: 17,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  // 1. 敷居 (床のライン) — 画面中央配置時にも端まで届くよう枠外まで伸ばす
  append(rc.line(-2000, 410, 2260, 400, style));

  // 2. ドア枠 (外側)
  append(rc.rectangle(30, 30, 200, 385, style));

  // 3. ドア本体
  append(rc.rectangle(45, 45, 170, 355, { ...style, roughness: 1.2 }));

  // 4. 上段パネル
  append(rc.rectangle(60, 60, 140, 130, style));

  // 5. 下段パネル
  append(rc.rectangle(60, 210, 140, 175, style));

  // 6. ドアノブ
  append(rc.circle(180, 230, 14, { ...style, fill: "#e2c6ff", fillStyle: "solid" }));
  append(rc.circle(180, 230, 6, style));

  // 7. 蝶番 (ヒンジ)
  append(rc.rectangle(48, 80, 8, 20, { ...style, strokeWidth: 1.5 }));
  append(rc.rectangle(48, 340, 8, 20, { ...style, strokeWidth: 1.5 }));

  return { width: 260, height: 440 };
}

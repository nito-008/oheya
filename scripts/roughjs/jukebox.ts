import type { RoughSVG } from "roughjs/bin/svg";

const style = {
  stroke: "#222222",
  strokeWidth: 2,
  roughness: 1.5,
  bowing: 1,
  fill: "transparent",
  seed: 42,
};

export default function draw(rc: RoughSVG, svg: SVGSVGElement) {
  const append = (el: SVGGElement | null) => {
    if (el) svg.appendChild(el);
  };

  // 1. 本体のベース (上辺は描かずアーチで閉じる)
  append(rc.line(50, 150, 50, 400, style));
  append(rc.line(50, 400, 250, 400, style));
  append(rc.line(250, 400, 250, 150, style));
  append(rc.arc(150, 150, 200, 150, Math.PI, 2 * Math.PI, false, style));

  // 2. レコードのディスプレイ窓
  append(rc.circle(150, 160, 130, style));
  append(rc.circle(150, 160, 95, { ...style, roughness: 1 }));
  append(rc.circle(150, 160, 35, style));

  // 3. トーンアーム
  append(rc.line(200, 215, 155, 170, { ...style, strokeWidth: 3 }));
  append(rc.circle(205, 220, 15, style));

  // 4. 曲を選ぶボタンの列
  const buttonStartX = 65;
  for (let i = 0; i < 6; i++) {
    append(rc.rectangle(buttonStartX + i * 29, 240, 20, 12, style));
  }

  // 5. スピーカーのグリル
  append(rc.rectangle(70, 275, 160, 105, style));
  const lineStartX = 90;
  for (let i = 0; i < 5; i++) {
    append(rc.line(lineStartX + i * 30, 275, lineStartX + i * 30, 380, style));
  }

  return { width: 300, height: 430 };
}

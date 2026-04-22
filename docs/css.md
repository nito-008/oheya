# CSS の方針

## モバイル対応

- CSS はモバイルファーストで書く。
- `min()`、`max()`、`clamp()`、`auto-fit` などで自然に伸縮できる場合は、メディアクエリを使わない。
- レイアウトの構造を切り替える必要がある場合だけ、`@media (min-width: 32rem)` を使う。

## グローバル CSS 変数

- `--ease-out-expo` がグローバルに使える。
- transition の easing は、特別な理由がなければ `var(--ease-out-expo)` を使う。

## フォント

- 基本はうずらフォントを使う。`html` に設定済み。
- タイトルには Caveat を使う。

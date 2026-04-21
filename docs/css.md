# CSS の方針

## モバイル対応

- PC ファーストで書く。
- モバイル対応のブレイクポイントは `32rem` にする。
- メディアクエリは基本的に `@media (max-width: 32rem)` を使う。

## グローバル CSS 変数

- `--ease-out-expo` がグローバルに使える。
- transition の easing は、特別な理由がなければ `var(--ease-out-expo)` を使う。

## フォント

- 基本はうずらフォントを使う。`html` に設定済み。
- タイトルには Caveat を使う。

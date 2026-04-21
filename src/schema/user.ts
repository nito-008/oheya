import * as v from "valibot";

export const PUBLIC_ID_MAX_LENGTH = 16;
export const NAME_MAX_LENGTH = 32;
export const ICON_URL_MAX_LENGTH = 120_000;

const inlineImagePattern = /^data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+$/;
const profileIconUrlPattern = /^\/api\/users\/[A-Za-z0-9_]+\/icon$/;

export const userSchema = v.object({
  publicId: v.pipe(
    v.string(),
    v.regex(/^[A-Za-z0-9_]+$/, "英数字とアンダースコアだけが使えます"),
    v.maxLength(PUBLIC_ID_MAX_LENGTH, `最大${PUBLIC_ID_MAX_LENGTH}文字です`),
  ),
  name: v.pipe(
    v.string(),
    v.minLength(1, "名前を入力してください"),
    v.maxLength(NAME_MAX_LENGTH, `最大${NAME_MAX_LENGTH}文字です`),
  ),
  iconUrl: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(ICON_URL_MAX_LENGTH, "アイコン画像が大きすぎます"),
      v.check(
        (value) =>
          value === "" || inlineImagePattern.test(value) || profileIconUrlPattern.test(value),
        "アイコン画像の形式が正しくありません",
      ),
    ),
    "",
  ),
});

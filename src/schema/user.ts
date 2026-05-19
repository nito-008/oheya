import * as v from "valibot";
import { imageIdPattern } from "~/schema/image";

export const PUBLIC_ID_MAX_LENGTH = 16;
export const NAME_MAX_LENGTH = 32;
export const publicIdPattern = /^[A-Za-z0-9_]+$/;

export const userSchema = v.object({
  publicId: v.pipe(
    v.string(),
    v.minLength(1, "IDを入力してください"),
    v.regex(publicIdPattern, "英数字とアンダースコアだけが使えます"),
    v.maxLength(PUBLIC_ID_MAX_LENGTH, `最大${PUBLIC_ID_MAX_LENGTH}文字です`),
  ),
  name: v.pipe(
    v.string(),
    v.minLength(1, "名前を入力してください"),
    v.maxLength(NAME_MAX_LENGTH, `最大${NAME_MAX_LENGTH}文字です`),
  ),
  icon: v.optional(
    v.pipe(
      v.string(),
      v.check(
        (value) => value === "" || imageIdPattern.test(value),
        "アイコン画像の形式が正しくありません",
      ),
    ),
    "",
  ),
  ogp: v.optional(
    v.pipe(
      v.string(),
      v.check(
        (value) => value === "" || imageIdPattern.test(value),
        "OGP画像の形式が正しくありません",
      ),
    ),
    "",
  ),
});

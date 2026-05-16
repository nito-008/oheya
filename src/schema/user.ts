import * as v from "valibot";
import { imageIdPattern } from "~/schema/image";

export const PUBLIC_ID_MAX_LENGTH = 16;
export const NAME_MAX_LENGTH = 32;
export const publicIdPattern = /^[A-Za-z0-9_]+$/;
const publicIdRequiredMessage = "IDを入力してください";
const publicIdPatternMessage = "英数字とアンダースコアだけが使えます";
const nameRequiredMessage = "名前を入力してください";

export const userSchema = v.object({
  publicId: v.pipe(
    v.string(),
    v.minLength(1, publicIdRequiredMessage),
    v.regex(publicIdPattern, publicIdPatternMessage),
    v.maxLength(PUBLIC_ID_MAX_LENGTH, `最大${PUBLIC_ID_MAX_LENGTH}文字です`),
  ),
  name: v.pipe(
    v.string(),
    v.minLength(1, nameRequiredMessage),
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
});

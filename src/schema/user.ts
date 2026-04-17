import * as v from "valibot";

export const PUBLIC_ID_MAX_LENGTH = 16;
export const NAME_MAX_LENGTH = 32;

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
});

import { component$, type PropsOf } from "@builder.io/qwik";
import clickSvg from "~/media/click.svg";
import tapSvg from "~/media/tap.svg";

type TapClickIconProps = Omit<PropsOf<"img">, "alt" | "height" | "src" | "srcset" | "width">;

export const TapClickIcon = component$<TapClickIconProps>((props) => {
  return (
    <picture aria-hidden="true">
      <source media="(hover: none) and (pointer: coarse)" srcset={tapSvg} />
      <img {...props} src={clickSvg} alt="" width={256} height={146} />
    </picture>
  );
});

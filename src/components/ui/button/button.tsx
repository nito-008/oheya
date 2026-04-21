import { component$, Slot, type PropsOf } from "@builder.io/qwik";
import styles from "./button.module.css";

type ButtonVariant = "accent" | "primary" | "secondary";
type ButtonSize = "md" | "sm";
type ButtonWidth = "fit" | "full";

type ButtonProps = Omit<PropsOf<"button">, "class"> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
  width?: ButtonWidth;
};

export const Button = component$<ButtonProps>(
  ({ size = "sm", type = "button", variant = "secondary", width = "fit", ...props }) => {
    return (
      <button
        {...props}
        class={[
          styles.button,
          styles[`variant-${variant}`],
          styles[`size-${size}`],
          styles[`width-${width}`],
        ]}
        type={type}
      >
        <Slot />
      </button>
    );
  },
);

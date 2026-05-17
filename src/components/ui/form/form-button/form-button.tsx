import { component$, Slot, type PropsOf } from "@builder.io/qwik";
import styles from "./form-button.module.css";

type FormButtonVariant = "accent" | "danger" | "primary" | "secondary";
type FormButtonSize = "md" | "sm";
type FormButtonWidth = "fit" | "full";

type FormButtonProps = Omit<PropsOf<"button">, "class"> & {
  size?: FormButtonSize;
  variant?: FormButtonVariant;
  width?: FormButtonWidth;
};

export const FormButton = component$<FormButtonProps>(
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

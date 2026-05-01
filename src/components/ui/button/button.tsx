import { component$, Slot, type PropsOf } from "@builder.io/qwik";
import { Link, type LinkProps } from "@builder.io/qwik-city";
import styles from "./button.module.css";

type ButtonBaseProps = {
  label: string;
};

type ButtonAsButtonProps = Omit<PropsOf<"button">, "class" | "type"> & {
  href?: never;
  type?: PropsOf<"button">["type"];
};

type ButtonAsLinkProps = Omit<LinkProps, "class"> & {
  href: string;
};

type ButtonProps = ButtonBaseProps & (ButtonAsButtonProps | ButtonAsLinkProps);

export const Button = component$<ButtonProps>((props) => {
  if ("href" in props) {
    const { label, href, ...linkProps } = props as ButtonBaseProps & ButtonAsLinkProps;

    return (
      <Link {...linkProps} href={href} class={styles.button}>
        <span class={styles.icon} aria-hidden="true">
          <Slot />
        </span>
        <span class={styles.label}>{label}</span>
      </Link>
    );
  }

  const { label, type = "button", ...buttonProps } = props as ButtonBaseProps & ButtonAsButtonProps;

  return (
    <button {...buttonProps} class={styles.button} type={type}>
      <span class={styles.icon} aria-hidden="true">
        <Slot />
      </span>
      <span class={styles.label}>{label}</span>
    </button>
  );
});

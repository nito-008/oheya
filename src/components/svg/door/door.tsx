import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import doorSvg from "~/media/door.svg?raw";
import styles from "./door.module.css";

type DoorProps = {
  href?: string;
};

export const Door = component$<DoorProps>(({ href }) => {
  const label = href ? "ランダムなお部屋に入る" : "ドア";

  return (
    <>
      {href ? (
        <Link
          href={href}
          prefetch="js"
          class={styles.door}
          aria-label={label}
          dangerouslySetInnerHTML={doorSvg}
        />
      ) : (
        <div class={styles.door} aria-label={label} dangerouslySetInnerHTML={doorSvg} />
      )}
    </>
  );
});

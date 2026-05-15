import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import doorSvg from "~/media/door.svg?raw";
import styles from "./door.module.css";

type DoorProps = {
  href?: string;
};

export const Door = component$<DoorProps>(({ href }) => {
  const label = href ? "誰かのお部屋に入る" : "ドア";
  const art = <span class={styles.art} dangerouslySetInnerHTML={doorSvg} />;

  return (
    <>
      {href ? (
        <Link href={href} prefetch="js" class={styles.door} aria-label={label}>
          {art}
        </Link>
      ) : (
        <div class={styles.door} aria-label={label}>
          {art}
        </div>
      )}
    </>
  );
});

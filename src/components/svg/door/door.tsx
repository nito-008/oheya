import { component$ } from "@builder.io/qwik";
import doorSvg from "~/media/door.svg?raw";
import styles from "./door.module.css";

export const Door = component$(() => {
  return <div class={styles.door} dangerouslySetInnerHTML={doorSvg} />;
});

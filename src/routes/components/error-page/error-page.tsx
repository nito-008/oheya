import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import houseSvg from "~/media/house.svg";
import styles from "./error-page.module.css";

type ErrorPageProps = {
  message: string;
};

export const getErrorPageMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  return "エラーが発生しました";
};

export const ErrorPage = component$<ErrorPageProps>(({ message }) => {
  return (
    <section class={styles.errorPage} aria-labelledby="error-page-message">
      <img class={styles.icon} src={houseSvg} alt="" width={160} height={160} />
      <div class={styles.textBlock}>
        <p id="error-page-message" class={styles.message}>
          {message}
        </p>
        <Link href="/" class={styles.homeLink}>
          ホームへ戻る
        </Link>
      </div>
    </section>
  );
});

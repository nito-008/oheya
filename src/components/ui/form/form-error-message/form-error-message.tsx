import { component$ } from "@builder.io/qwik";
import styles from "./form-error-message.module.css";

type FormErrorMessageProps = {
  message?: string;
};

export const FormErrorMessage = component$<FormErrorMessageProps>(({ message }) => {
  if (!message) return null;

  return (
    <span class={styles.error} role="alert">
      {message}
    </span>
  );
});

import { component$ } from "@builder.io/qwik";
import styles from "./form-submit-button.module.css";

type FormSubmitButtonProps = {
  disabled?: boolean;
  label: string;
  submitting?: boolean;
  submittingLabel: string;
};

export const FormSubmitButton = component$<FormSubmitButtonProps>(
  ({ disabled = false, label, submitting = false, submittingLabel }) => {
    return (
      <button class={styles.button} type="submit" disabled={disabled || submitting}>
        {submitting ? submittingLabel : label}
      </button>
    );
  },
);

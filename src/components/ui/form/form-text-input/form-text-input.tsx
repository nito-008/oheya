import { component$, type QRL } from "@builder.io/qwik";
import type { FieldElement, FieldEvent } from "@modular-forms/qwik";
import { FormErrorMessage } from "~/components/ui/form/form-error-message/form-error-message";
import styles from "./form-text-input.module.css";

type FieldProps = {
  name: string;
  autoFocus: boolean;
  ref: QRL<(element: FieldElement) => void>;
  onInput$: QRL<(event: FieldEvent, element: FieldElement) => void>;
  onChange$: QRL<(event: FieldEvent, element: FieldElement) => void>;
  onBlur$: QRL<(event: FieldEvent, element: FieldElement) => void>;
};

type FieldState = {
  value?: string | null;
  error?: string;
};

type FormTextInputProps = {
  label: string;
  field: FieldState;
  fieldProps: FieldProps;
  maxLength?: number;
  onInput$?: QRL<(value: string) => void>;
  required?: boolean;
  type?: "email" | "password" | "search" | "tel" | "text" | "url";
};

export const FormTextInput = component$<FormTextInputProps>(
  ({ label, field, fieldProps, maxLength, onInput$, required = false, type = "text" }) => {
    return (
      <label class={styles.field}>
        <span class={styles.label}>{label}</span>
        <input
          {...fieldProps}
          class={styles.input}
          type={type}
          value={field.value}
          maxLength={maxLength}
          onInput$={async (event, element) => {
            await fieldProps.onInput$(event, element);
            await onInput$?.(element.value);
          }}
          required={required}
        />
        <FormErrorMessage message={field.error} />
      </label>
    );
  },
);

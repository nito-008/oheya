import { component$, type QRL } from "@builder.io/qwik";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import { Modal } from "~/components/ui/modal/modal";
import styles from "./confirm-dialog.module.css";

type ConfirmDialogVariant = "primary" | "danger";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmLabel: string;
  confirmVariant?: ConfirmDialogVariant;
  message: string;
  open: boolean;
  title: string;
  onClose$: QRL<() => void | Promise<void>>;
  onConfirm$: QRL<() => void | Promise<void>>;
};

export const ConfirmDialog = component$<ConfirmDialogProps>(
  ({
    cancelLabel = "キャンセル",
    confirmDisabled = false,
    confirmLabel,
    confirmVariant = "primary",
    message,
    open,
    title,
    onClose$,
    onConfirm$,
  }) => {
    return (
      <Modal open={open} title={title} onClose$={onClose$}>
        <div class={styles.content}>
          <p class={styles.message}>{message}</p>
          <div class={styles.actions}>
            <FormButton
              type="button"
              variant="secondary"
              disabled={confirmDisabled}
              onClick$={onClose$}
            >
              {cancelLabel}
            </FormButton>
            <FormButton
              type="button"
              variant={confirmVariant}
              disabled={confirmDisabled}
              onClick$={onConfirm$}
            >
              {confirmLabel}
            </FormButton>
          </div>
        </div>
      </Modal>
    );
  },
);

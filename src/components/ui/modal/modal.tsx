import { component$, Slot, useSignal, useVisibleTask$, type QRL } from "@builder.io/qwik";
import styles from "./modal.module.css";

type ModalProps = {
  open: boolean;
  title: string;
  onClose$: QRL<() => void>;
};

export const Modal = component$<ModalProps>(({ open, title, onClose$ }) => {
  const dialogRef = useSignal<HTMLDialogElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => open);
    const dialog = dialogRef.value;
    if (!open || !dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    dialog.focus();

    cleanup(() => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    });
  });

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      class={styles.dialog}
      aria-label={title}
      onClick$={async (event) => {
        const dialog = dialogRef.value;
        if (!dialog || event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();
        const clickedBackdrop =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (clickedBackdrop) await onClose$();
      }}
      onCancel$={async (event) => {
        event.preventDefault();
        await onClose$();
      }}
    >
      <div class={styles.header}>
        <h2 class={styles.title}>{title}</h2>
      </div>
      <div class={styles.body}>
        <Slot />
      </div>
    </dialog>
  );
});

import {
  $,
  Slot,
  component$,
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from "@builder.io/qwik";
import toastCheckSvg from "~/media/icons/toast/check.svg?raw";
import toastErrorSvg from "~/media/icons/toast/error.svg?raw";
import toastWarningSvg from "~/media/icons/toast/warning.svg?raw";
import styles from "./toast.module.css";

export type ToastVariant = "success" | "error" | "warning";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  exiting?: boolean;
};

type ToastState = {
  message: Signal<string | null>;
  variant: Signal<ToastVariant>;
  exiting: Signal<boolean>;
};

type ToastOptions = {
  variant?: ToastVariant;
  message: string;
};

type ToastApi = {
  show: QRL<(options: ToastOptions) => void>;
  success: QRL<(message: string) => void>;
  error: QRL<(message: string) => void>;
  warning: QRL<(message: string) => void>;
};

const ToastContext = createContextId<ToastState>("ui.toast");

const toastIconByVariant: Record<ToastVariant, string> = {
  success: toastCheckSvg,
  error: toastErrorSvg,
  warning: toastWarningSvg,
};

const ToastItem = component$<ToastProps>(({ message, variant = "success", exiting = false }) => {
  return (
    <div
      class={{
        [styles.toast]: true,
        [styles[`variant-${variant}`]]: true,
        [styles.exiting]: exiting,
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        class={styles.icon}
        aria-hidden="true"
        dangerouslySetInnerHTML={toastIconByVariant[variant]}
      />
      <span class={styles.message}>{message}</span>
    </div>
  );
});

export const ToastProvider = component$(() => {
  const message = useSignal<string | null>(null);
  const variant = useSignal<ToastVariant>("success");
  const exiting = useSignal(false);

  useContextProvider(ToastContext, { message, variant, exiting });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => message.value);
    track(() => exiting.value);

    if (!message.value) return;

    const timeoutId = window.setTimeout(
      () => {
        if (exiting.value) {
          message.value = null;
          exiting.value = false;
          return;
        }

        exiting.value = true;
      },
      exiting.value ? 220 : 2200,
    );

    cleanup(() => {
      window.clearTimeout(timeoutId);
    });
  });

  return (
    <>
      <Slot />
      {message.value && (
        <ToastItem message={message.value} variant={variant.value} exiting={exiting.value} />
      )}
    </>
  );
});

export const useToast = () => {
  const toast = useContext(ToastContext);

  const show = $((options: ToastOptions) => {
    const { message, variant = "success" } = options;
    toast.message.value = message;
    toast.variant.value = variant;
    toast.exiting.value = false;
  });

  return {
    show,
    success: $((message: string) => show({ variant: "success", message })),
    error: $((message: string) => show({ variant: "error", message })),
    warning: $((message: string) => show({ variant: "warning", message })),
  } satisfies ToastApi;
};

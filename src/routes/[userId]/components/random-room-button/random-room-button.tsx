import { $, component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button/button";
import { useToast } from "~/components/ui/toast/toast";
import doorSvg from "~/media/icons/door.svg";
import { getUserRoomHref } from "~/lib/room";
import styles from "./random-room-button.module.css";

type RandomRoomButtonProps = {
  currentPublicId: string;
};

export const RandomRoomButton = component$<RandomRoomButtonProps>(({ currentPublicId }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const loading = useSignal(false);

  const goToRandomRoom$ = $(async () => {
    if (loading.value) return;

    loading.value = true;

    try {
      const params = new URLSearchParams({ exclude: currentPublicId });
      const res = await fetch(`/api/users/random?${params.toString()}`);

      if (res.status === 404) {
        await toast.error("ほかのお部屋がまだありません");
        return;
      }

      if (!res.ok) {
        await toast.error("お部屋を探せませんでした");
        return;
      }

      const { publicId } = (await res.json()) as { publicId: string };
      await navigate(getUserRoomHref(publicId));
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class={styles.action}>
      <Button label="誰かのお部屋へ" onClick$={goToRandomRoom$} disabled={loading.value}>
        <img class={styles.icon} src={doorSvg} alt="" width={24} height={24} />
      </Button>
    </div>
  );
});

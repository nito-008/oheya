import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import musicPauseSvg from "~/media/music-pause.svg";
import musicPlaySvg from "~/media/music-play.svg";
import songJacketFrameSvg from "~/media/song-jacket-frame.svg";
import type { MusicTrack } from "~/schema/music";
import styles from "./song-jacket.module.css";

const APPLE_MUSIC_BADGE_URL =
  "https://toolbox.marketingtools.apple.com/api/v2/badges/listen-on-apple-music/mono-black/en-us?releaseDate=1754438400";

type SongJacketProps = {
  publicId: string;
};

export const SongJacket = component$<SongJacketProps>(({ publicId }) => {
  const track = useSignal<MusicTrack | null>(null);
  const hasError = useSignal(false);
  const isLoading = useSignal(true);
  const isPlaying = useSignal(false);
  const audioRef = useSignal<HTMLAudioElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track: trackSignal, cleanup }) => {
    trackSignal(() => publicId);

    const controller = new AbortController();
    isLoading.value = true;
    hasError.value = false;
    track.value = null;

    void (async () => {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(publicId)}/music`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }

        const data = (await response.json()) as { track: MusicTrack | null };
        track.value = data.track;
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Music fetch error:", error);
        hasError.value = true;
      } finally {
        if (!controller.signal.aborted) {
          isLoading.value = false;
        }
      }
    })();

    cleanup(() => {
      controller.abort();
      audioRef.value?.pause();
    });
  });

  const artworkUrl =
    track.value?.artworkUrl?.replace("300x300bb", "600x600bb") ?? track.value?.artworkUrl ?? null;

  return (
    <article class={styles.songJacket} aria-label="音楽プレビュー">
      <div class={styles.frameShell}>
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${track.value?.title ?? "選択中の曲"}のジャケット`}
            width={600}
            height={600}
            class={styles.jacketImage}
          />
        ) : (
          <div class={styles.jacketFallback} aria-hidden="true" />
        )}
        <img
          src={songJacketFrameSvg}
          alt=""
          width={360}
          height={400}
          class={styles.frameImage}
          aria-hidden="true"
        />
        <button
          type="button"
          class={{
            [styles.playButton]: true,
            [styles.playButtonPlaying]: isPlaying.value,
          }}
          aria-label={isPlaying.value ? "プレビューを一時停止" : "プレビューを再生"}
          disabled={!track.value?.previewUrl}
          onClick$={async () => {
            const audio = audioRef.value;
            if (!audio) return;

            if (audio.paused) {
              await audio.play();
              isPlaying.value = true;
            } else {
              audio.pause();
              isPlaying.value = false;
            }
          }}
        >
          <img
            src={isPlaying.value ? musicPauseSvg : musicPlaySvg}
            alt=""
            width={56}
            height={56}
            class={styles.playIcon}
            aria-hidden="true"
          />
        </button>
      </div>
      <div class={styles.trackInfo}>
        <p class={styles.trackTitle}>
          {hasError.value
            ? "楽曲情報の取得に失敗しました"
            : isLoading.value
              ? "読み込み中..."
              : (track.value?.title ?? "まだ曲が設定されていません")}
        </p>
        <p class={styles.trackArtist}>
          {isLoading.value
            ? "読み込み中..."
            : (track.value?.artist ?? "プロフィール設定から曲を選択してください")}
        </p>
      </div>
      {track.value?.trackViewUrl && (
        <a
          href={track.value.trackViewUrl}
          class={styles.appleMusicBadgeLink}
          aria-label="Apple Musicで開く"
        >
          <img
            src={APPLE_MUSIC_BADGE_URL}
            alt="Listen on Apple Music"
            width={282}
            height={82}
            class={styles.appleMusicBadge}
          />
        </a>
      )}
      {track.value?.previewUrl ? (
        <audio
          ref={audioRef}
          src={track.value.previewUrl}
          onEnded$={() => {
            isPlaying.value = false;
          }}
          onPause$={() => {
            isPlaying.value = false;
          }}
          onPlay$={() => {
            isPlaying.value = true;
          }}
        />
      ) : null}
    </article>
  );
});

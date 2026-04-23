import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import imageFrameSvg from "~/media/image-frame.svg";
import musicPauseSvg from "~/media/music-pause.svg";
import musicPlaySvg from "~/media/music-play.svg";
import styles from "./music-frame.module.css";

const SEARCH_TERM = "ルピラ";
const APPLE_MUSIC_URL =
  "https://music.apple.com/jp/album/the-idolm-ster-shiny-colors-%E5%86%86%E7%92%B0-halo-around-03-ep/1825101865?itscg=30200&itsct=music_box_badge&ls=1&app=music&mttnsubad=1825101865";
const APPLE_MUSIC_BADGE_URL =
  "https://toolbox.marketingtools.apple.com/api/v2/badges/listen-on-apple-music/mono-black/en-us?releaseDate=1754438400";

type AppleMusicTrack = {
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackName: string;
};

export const MusicFrame = component$(() => {
  const track = useSignal<AppleMusicTrack>();
  const hasError = useSignal(false);
  const isPlaying = useSignal(false);
  const audioRef = useSignal<HTMLAudioElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      const params = new URLSearchParams({
        country: "jp",
        entity: "song",
        lang: "ja_jp",
        limit: "1",
        term: SEARCH_TERM,
      });
      const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
      const data = (await response.json()) as { results?: AppleMusicTrack[] };
      const firstTrack = data.results?.[0];

      if (!firstTrack) {
        hasError.value = true;
        return;
      }

      track.value = firstTrack;
    } catch (error) {
      console.error("Fetch error:", error);
      hasError.value = true;
    }
  });

  const artworkUrl = track.value?.artworkUrl100.replace("100x100bb", "600x600bb");

  return (
    <article class={styles.musicFrame} aria-label="音楽プレビュー">
      <div class={styles.frameShell}>
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${track.value?.trackName ?? SEARCH_TERM}のジャケット`}
            width={600}
            height={600}
            class={styles.jacketImage}
          />
        ) : (
          <div class={styles.jacketFallback} aria-hidden="true" />
        )}
        <img
          src={imageFrameSvg}
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
            ? "音楽を読み込めませんでした"
            : (track.value?.trackName ?? "読み込み中...")}
        </p>
        <p class={styles.trackArtist}>{track.value?.artistName ?? "Apple Music"}</p>
      </div>
      <a href={APPLE_MUSIC_URL} class={styles.appleMusicBadgeLink} aria-label="Apple Musicで開く">
        <img
          src={APPLE_MUSIC_BADGE_URL}
          alt="Listen on Apple Music"
          width={282}
          height={82}
          class={styles.appleMusicBadge}
        />
      </a>
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

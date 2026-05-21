import {
  component$,
  noSerialize,
  useSignal,
  useVisibleTask$,
  type NoSerialize,
} from "@builder.io/qwik";
import type { Howl } from "howler";
import musicPauseSvg from "~/media/music-pause.svg";
import musicPlaySvg from "~/media/music-play.svg";
import songPlaceholderSvg from "~/media/song-placeholder.svg";
import songJacketFrameSvg from "~/media/song-jacket-frame.svg";
import { APPLE_MUSIC_ARTWORK_SIZE, getAppleMusicArtworkUrl } from "~/lib/music-artwork";
import type { MusicTrack } from "~/schema/music";
import {
  createPreviewSound,
  pausePreviewSound,
  PREVIEW_FADE_IN_DURATION_MS,
  PREVIEW_PAUSE_RESUME_FADE_DURATION_MS,
  type PreviewSoundState,
  unloadPreviewSound,
} from "./song-jacket-audio";
import styles from "./song-jacket.module.css";

const APPLE_MUSIC_BADGE_URL =
  "https://toolbox.marketingtools.apple.com/api/v2/badges/listen-on-apple-music/mono-black/en-us?releaseDate=1754438400";
const EMPTY_TRACK_TITLE = "楽曲未設定";
const EMPTY_TRACK_ARTIST = "設定から変更できます";
const SONG_PLACEHOLDER_SIZE = 96;

type SongJacketProps = {
  track: MusicTrack | null;
};

export const SongJacket = component$<SongJacketProps>(({ track }) => {
  const isPlaying = useSignal(false);
  const previewSound = useSignal<NoSerialize<Howl>>();
  const previewSoundId = useSignal<number>();
  const naturalFadeStarted = useSignal(false);
  const naturalFadeTimeoutId = useSignal<number>();
  const pauseFadeTimeoutId = useSignal<number>();
  const previewFadeInDurationMs = useSignal(PREVIEW_FADE_IN_DURATION_MS);
  const shouldFadeIn = useSignal(true);

  const trackTitle = track?.title ?? EMPTY_TRACK_TITLE;
  const canPlayPreview = !!track?.previewUrl;
  const artworkUrl = getAppleMusicArtworkUrl(track?.artworkUrl, APPLE_MUSIC_ARTWORK_SIZE);
  const mediaArtworkUrl = artworkUrl ?? songPlaceholderSvg;
  const mediaArtworkSize = artworkUrl ? APPLE_MUSIC_ARTWORK_SIZE : SONG_PLACEHOLDER_SIZE;
  const mediaArtworkType = artworkUrl ? "image/jpeg" : "image/svg+xml";
  const soundState: PreviewSoundState = {
    isPlaying,
    naturalFadeStarted,
    naturalFadeTimeoutId,
    pauseFadeTimeoutId,
    previewFadeInDurationMs,
    previewSound,
    previewSoundId,
    shouldFadeIn,
  };
  const previewMetadata = track
    ? {
        mediaArtworkSize,
        mediaArtworkType,
        mediaArtworkUrl,
        track,
      }
    : null;

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track: trackSignal, cleanup }) => {
    trackSignal(() => track?.previewUrl);

    cleanup(() => {
      unloadPreviewSound(soundState);
    });
  });

  return (
    <article class={styles.songJacket} aria-label="選択中のプレビュー">
      <div class={styles.frameShell}>
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${trackTitle}のジャケット`}
            width={APPLE_MUSIC_ARTWORK_SIZE}
            height={APPLE_MUSIC_ARTWORK_SIZE}
            class={styles.jacketImage}
          />
        ) : (
          <span class={styles.jacketPlaceholderSurface} aria-hidden="true">
            <img
              src={songPlaceholderSvg}
              alt=""
              width={SONG_PLACEHOLDER_SIZE}
              height={SONG_PLACEHOLDER_SIZE}
              class={styles.jacketPlaceholder}
            />
          </span>
        )}
        <img
          src={songJacketFrameSvg}
          alt=""
          width={360}
          height={400}
          class={styles.frameImage}
          aria-hidden="true"
        />
        {canPlayPreview && (
          <button
            type="button"
            class={{
              [styles.playButton]: true,
              [styles.playButtonPlaying]: isPlaying.value,
            }}
            aria-label={isPlaying.value ? "プレビューを一時停止" : "プレビューを再生"}
            onClick$={async () => {
              if (!isPlaying.value) {
                if (!previewMetadata) return;

                let sound = soundState.previewSound.value;
                if (!sound) {
                  const createdSound = await createPreviewSound(soundState, previewMetadata);
                  if (!createdSound) return;

                  sound = createdSound;
                  previewSound.value = noSerialize(createdSound);
                }
                if (!sound) return;

                const pausedSoundId = soundState.previewSoundId.value;
                const seek = pausedSoundId === undefined ? 0 : sound.seek(pausedSoundId);
                const isResuming = typeof seek === "number" && seek > 0.1;

                shouldFadeIn.value = true;
                previewFadeInDurationMs.value = isResuming
                  ? PREVIEW_PAUSE_RESUME_FADE_DURATION_MS
                  : PREVIEW_FADE_IN_DURATION_MS;
                sound.volume(0);
                soundState.previewSoundId.value =
                  pausedSoundId === undefined ? sound.play() : sound.play(pausedSoundId);
              } else {
                pausePreviewSound(soundState);
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
        )}
      </div>
      <div class={styles.trackInfo}>
        <p class={styles.trackTitle}>{trackTitle}</p>
        <p class={styles.trackArtist}>{track?.artist ?? EMPTY_TRACK_ARTIST}</p>
      </div>
      {track?.trackViewUrl && (
        <a
          href={track.trackViewUrl}
          target="_blank"
          rel="noreferrer"
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
    </article>
  );
});

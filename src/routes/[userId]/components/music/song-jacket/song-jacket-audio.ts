import type { Howl } from "howler";
import type { MusicTrack } from "~/schema/music";

export const PREVIEW_FADE_IN_DURATION_MS = 200;
export const PREVIEW_FADE_OUT_DURATION_MS = 1_500;
export const PREVIEW_FALLBACK_DURATION_MS = 30_000;
export const PREVIEW_PAUSE_RESUME_FADE_DURATION_MS = 200;
export const PREVIEW_VOLUME = 1;

type ValueRef<T> = {
  value: T;
};

export type PreviewSoundState = {
  isPlaying: ValueRef<boolean>;
  naturalFadeStarted: ValueRef<boolean>;
  naturalFadeTimeoutId: ValueRef<number | undefined>;
  pauseFadeTimeoutId: ValueRef<number | undefined>;
  previewFadeInDurationMs: ValueRef<number>;
  previewSound: ValueRef<Howl | undefined>;
  previewSoundId: ValueRef<number | undefined>;
  shouldFadeIn: ValueRef<boolean>;
};

export type PreviewMetadata = {
  mediaArtworkSize: number;
  mediaArtworkType: string;
  mediaArtworkUrl: string;
  track: MusicTrack;
};

const setPreviewPlaybackState = (state: MediaSessionPlaybackState) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = state;
  }
};

export const cancelNaturalFade = (state: PreviewSoundState) => {
  state.naturalFadeStarted.value = false;

  if (state.naturalFadeTimeoutId.value !== undefined) {
    window.clearTimeout(state.naturalFadeTimeoutId.value);
    state.naturalFadeTimeoutId.value = undefined;
  }
};

export const cancelPauseFade = (state: PreviewSoundState) => {
  if (state.pauseFadeTimeoutId.value !== undefined) {
    window.clearTimeout(state.pauseFadeTimeoutId.value);
    state.pauseFadeTimeoutId.value = undefined;
  }
};

export const resetPreviewState = (
  state: PreviewSoundState,
  playbackState: MediaSessionPlaybackState = "none",
) => {
  cancelNaturalFade(state);
  cancelPauseFade(state);
  state.previewSound.value?.volume(PREVIEW_VOLUME);
  if (playbackState !== "paused") {
    state.previewSoundId.value = undefined;
  }
  state.isPlaying.value = false;
  setPreviewPlaybackState(playbackState);
};

const setPreviewMetadata = (metadata: PreviewMetadata) => {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: metadata.track.title,
    artist: metadata.track.artist,
    album: "Oheya",
    artwork: [
      {
        src: new URL(metadata.mediaArtworkUrl, window.location.href).href,
        sizes: `${metadata.mediaArtworkSize}x${metadata.mediaArtworkSize}`,
        type: metadata.mediaArtworkType,
      },
    ],
  });
  navigator.mediaSession.playbackState = "playing";
};

const startNaturalFadeOut = (state: PreviewSoundState) => {
  if (state.naturalFadeStarted.value) return;

  const sound = state.previewSound.value;
  const soundId = state.previewSoundId.value;
  if (!sound || soundId === undefined || !sound.playing(soundId)) return;

  state.naturalFadeStarted.value = true;

  if (state.naturalFadeTimeoutId.value !== undefined) {
    window.clearTimeout(state.naturalFadeTimeoutId.value);
    state.naturalFadeTimeoutId.value = undefined;
  }

  sound.fade(PREVIEW_VOLUME, 0, PREVIEW_FADE_OUT_DURATION_MS, soundId);
};

export const scheduleNaturalFadeOut = (state: PreviewSoundState) => {
  const sound = state.previewSound.value;
  const soundId = state.previewSoundId.value;
  if (!sound || soundId === undefined) return;

  cancelNaturalFade(state);

  const durationMs = sound.duration(soundId) * 1000;
  const seek = sound.seek(soundId);
  const seekMs = typeof seek === "number" ? seek * 1000 : 0;
  const remainingMs =
    durationMs > 0
      ? Math.max(durationMs - seekMs, 0)
      : Math.max(PREVIEW_FALLBACK_DURATION_MS - seekMs, 0);
  const fadeDelayMs = Math.max(remainingMs - PREVIEW_FADE_OUT_DURATION_MS, 0);

  state.naturalFadeTimeoutId.value = window.setTimeout(
    () => startNaturalFadeOut(state),
    fadeDelayMs,
  );
};

export const createPreviewSound = async (
  state: PreviewSoundState,
  metadata: PreviewMetadata,
): Promise<Howl | null> => {
  if (!metadata.track.previewUrl) return null;

  const { Howl } = await import("howler");
  return new Howl({
    src: [metadata.track.previewUrl],
    html5: true,
    volume: PREVIEW_VOLUME,
    onend: () => {
      resetPreviewState(state, "none");
    },
    onload: () => {
      if (state.isPlaying.value) scheduleNaturalFadeOut(state);
    },
    onpause: () => {
      resetPreviewState(state, "paused");
    },
    onplay: (soundId) => {
      cancelPauseFade(state);
      state.previewSoundId.value = soundId;
      state.isPlaying.value = true;
      setPreviewMetadata(metadata);
      if (state.shouldFadeIn.value) {
        state.previewSound.value?.fade(
          0,
          PREVIEW_VOLUME,
          state.previewFadeInDurationMs.value,
          soundId,
        );
      } else {
        state.previewSound.value?.volume(PREVIEW_VOLUME, soundId);
      }
      scheduleNaturalFadeOut(state);
    },
    onstop: () => {
      resetPreviewState(state, "none");
    },
  });
};

export const pausePreviewSound = (state: PreviewSoundState) => {
  cancelNaturalFade(state);
  cancelPauseFade(state);

  const sound = state.previewSound.value;
  const soundId = state.previewSoundId.value;
  if (!sound || soundId === undefined) {
    resetPreviewState(state, "paused");
    return;
  }

  state.isPlaying.value = false;
  setPreviewPlaybackState("paused");
  const currentVolume = sound.volume(soundId);
  sound.fade(
    typeof currentVolume === "number" ? currentVolume : PREVIEW_VOLUME,
    0,
    PREVIEW_PAUSE_RESUME_FADE_DURATION_MS,
    soundId,
  );
  state.pauseFadeTimeoutId.value = window.setTimeout(() => {
    state.pauseFadeTimeoutId.value = undefined;
    sound.pause(soundId);
    sound.volume(PREVIEW_VOLUME, soundId);
  }, PREVIEW_PAUSE_RESUME_FADE_DURATION_MS);
};

export const unloadPreviewSound = (state: PreviewSoundState) => {
  cancelNaturalFade(state);
  cancelPauseFade(state);
  state.previewSound.value?.unload();
  state.previewSound.value = undefined;
  state.previewSoundId.value = undefined;
  state.previewFadeInDurationMs.value = PREVIEW_FADE_IN_DURATION_MS;
  state.shouldFadeIn.value = true;
  state.isPlaying.value = false;
  setPreviewPlaybackState("none");
};

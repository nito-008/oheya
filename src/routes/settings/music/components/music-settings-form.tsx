import { $, component$, useSignal, useVisibleTask$, type QRL } from "@builder.io/qwik";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import inputStyles from "~/components/ui/form/form-text-input/form-text-input.module.css";
import { useToast } from "~/components/ui/toast/toast";
import { APPLE_MUSIC_ARTWORK_SIZE, getAppleMusicArtworkUrl } from "~/lib/music-artwork";
import type { MusicTrack } from "~/schema/music";
import formStyles from "~/routes/signup/index.module.css";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import styles from "./music-settings-form.module.css";

const appleMusicSearchEndpoint = "https://itunes.apple.com/search";
const appleMusicSearchTimeoutMs = 10_000;

type ITunesTrack = {
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
};

type ITunesSearchResponse = {
  results?: ITunesTrack[];
};

type AppleMusicSearchWindow = Window &
  typeof globalThis &
  Record<string, ((data: ITunesSearchResponse) => void) | undefined>;

type MusicSettingsFormProps = {
  initialTrack: MusicTrack | null;
  onNext$?: QRL<() => void>;
  saveOnSelect?: boolean;
};

const getTrackLabel = (track: Pick<MusicTrack, "title" | "artist">) =>
  `${track.title.slice(0, 1)}${track.artist.slice(0, 1)}`.toUpperCase();

const cloneTrack = (track: MusicTrack): MusicTrack => ({ ...track });

let appleMusicSearchSequence = 0;

const isMusicTrackResult = (
  track: ITunesTrack,
): track is ITunesTrack & { artistName: string; trackId: number; trackName: string } =>
  typeof track.trackId === "number" && !!track.trackName && !!track.artistName;

const toMusicTrack = (
  track: ITunesTrack & { artistName: string; trackId: number; trackName: string },
) => ({
  id: String(track.trackId),
  title: track.trackName,
  artist: track.artistName,
  artworkUrl: getAppleMusicArtworkUrl(track.artworkUrl100, APPLE_MUSIC_ARTWORK_SIZE),
  previewUrl: track.previewUrl ?? null,
  trackViewUrl: track.trackViewUrl ?? null,
});

const toMusicTracks = (data: ITunesSearchResponse): MusicTrack[] =>
  (data.results ?? []).filter(isMusicTrackResult).map(toMusicTrack);

const searchAppleMusic = (term: string, signal: AbortSignal): Promise<MusicTrack[]> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const callbackName = `__oheyaAppleMusicSearch${Date.now()}${appleMusicSearchSequence++}`;
    const params = new URLSearchParams({
      callback: callbackName,
      country: "jp",
      entity: "song",
      lang: "ja_jp",
      limit: "10",
      term,
    });
    const script = document.createElement("script");
    const searchWindow = window as AppleMusicSearchWindow;
    let isSettled = false;
    let timeoutId = 0;

    const cleanup = () => {
      signal.removeEventListener("abort", abortSearch);
      window.clearTimeout(timeoutId);
      script.remove();
      delete searchWindow[callbackName];
    };

    const rejectSearch = (error: Error) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(error);
    };

    const abortSearch = () => {
      rejectSearch(new Error("Aborted"));
    };

    searchWindow[callbackName] = (data) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(toMusicTracks(data));
    };

    script.async = true;
    script.onerror = () => {
      rejectSearch(new Error("音楽の検索に失敗しました"));
    };
    script.src = `${appleMusicSearchEndpoint}?${params.toString()}`;

    signal.addEventListener("abort", abortSearch, { once: true });
    timeoutId = window.setTimeout(() => {
      rejectSearch(new Error("音楽の検索に失敗しました"));
    }, appleMusicSearchTimeoutMs);
    document.head.appendChild(script);
  });

export const MusicSettingsForm = component$<MusicSettingsFormProps>((props) => {
  const { initialTrack, onNext$, saveOnSelect = true } = props;
  const query = useSignal("");
  const results = useSignal<MusicTrack[]>([]);
  const selectedTrack = useSignal<MusicTrack | null>(
    initialTrack ? cloneTrack(initialTrack) : null,
  );
  const isSearchActive = useSignal(false);
  const isComposing = useSignal(false);
  const isSearching = useSignal(false);
  const isSaving = useSignal(false);
  const searchError = useSignal<string | null>(null);
  const saveError = useSignal<string | null>(null);
  const toast = useToast();

  const normalizedQuery = query.value.trim().toLowerCase();
  const canContinue = !!selectedTrack.value;

  const saveMusic$ = $(async (track: MusicTrack, previousTrack: MusicTrack | null) => {
    if (isSaving.value) return;

    isSaving.value = true;
    saveError.value = null;

    try {
      const response = await fetch("/api/users/me/music", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ track }),
      });

      if (response.status === 401) {
        throw new Error("ログインが必要です");
      }
      if (response.status === 404) {
        throw new Error("プロフィールが見つかりません");
      }
      if (!response.ok) {
        throw new Error("保存に失敗しました");
      }

      await toast.success("保存しました");
    } catch (error) {
      selectedTrack.value = previousTrack;
      const message = error instanceof Error ? error.message : "保存に失敗しました";
      saveError.value = message;
      await toast.error(message);
    } finally {
      isSaving.value = false;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => query.value);
    track(() => isComposing.value);

    const currentQuery = query.value.trim();
    if (!currentQuery || isComposing.value) {
      results.value = [];
      isSearching.value = false;
      searchError.value = null;
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      isSearching.value = true;
      searchError.value = null;

      try {
        results.value = await searchAppleMusic(currentQuery, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Music search error:", error);
        results.value = [];
        searchError.value = error instanceof Error ? error.message : "音楽の検索に失敗しました";
      } finally {
        if (!controller.signal.aborted) {
          isSearching.value = false;
        }
      }
    }, 250);

    cleanup(() => {
      controller.abort();
      window.clearTimeout(timeoutId);
    });
  });

  return (
    <section class={`${formStyles.form} ${sharedStyles.content} ${styles.panel}`}>
      {selectedTrack.value && (
        <div key={selectedTrack.value.id} class={styles.selectedTrackRow}>
          <div class={styles.albumArt} aria-hidden="true">
            {selectedTrack.value.artworkUrl ? (
              <img
                src={selectedTrack.value.artworkUrl}
                alt=""
                width={56}
                height={56}
                class={styles.albumArtImage}
              />
            ) : (
              <span>{getTrackLabel(selectedTrack.value)}</span>
            )}
          </div>
          <div class={styles.selectedMeta}>
            <strong>{selectedTrack.value.title}</strong>
            <span>{selectedTrack.value.artist}</span>
          </div>
        </div>
      )}

      <div
        class={styles.searchArea}
        onFocusin$={() => {
          isSearchActive.value = true;
        }}
        onFocusout$={(event, currentTarget) => {
          const nextFocused = (event as FocusEvent).relatedTarget;
          if (!(nextFocused instanceof Node) || !currentTarget.contains(nextFocused)) {
            isSearchActive.value = false;
          }
        }}
      >
        <label class={inputStyles.field} for="music-search">
          <span class={inputStyles.label}>曲を検索</span>
          <input
            id="music-search"
            type="text"
            class={inputStyles.input}
            placeholder="曲名、アーティスト名で検索"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellcheck={false}
            value={query.value}
            onCompositionStart$={() => {
              isComposing.value = true;
            }}
            onCompositionEnd$={() => {
              isComposing.value = false;
            }}
            onInput$={(_, target) => {
              query.value = target.value;
              saveError.value = null;
            }}
          />
        </label>

        {isSearchActive.value && normalizedQuery && !isComposing.value && (
          <div class={styles.resultsCard} aria-live="polite">
            {isSearching.value && <p class={styles.placeholder}>検索中...</p>}

            {!isSearching.value && searchError.value && (
              <p class={styles.placeholder}>{searchError.value}</p>
            )}

            {!isSearching.value && !searchError.value && results.value.length === 0 && (
              <p class={styles.placeholder}>一致する曲が見つかりませんでした。</p>
            )}

            {results.value.length > 0 && (
              <ul class={styles.resultsList}>
                {results.value.map((track) => {
                  const isSelected = track.id === selectedTrack.value?.id;

                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        class={{
                          [styles.resultButton]: true,
                          [styles.resultButtonSelected]: isSelected,
                        }}
                        disabled={isSaving.value}
                        onClick$={async () => {
                          if (isSaving.value) return;

                          const previousTrack = selectedTrack.value
                            ? cloneTrack(selectedTrack.value)
                            : null;
                          const nextTrack = cloneTrack(track);

                          selectedTrack.value = nextTrack;
                          query.value = "";
                          results.value = [];
                          searchError.value = null;
                          saveError.value = null;
                          isSearchActive.value = false;

                          if (saveOnSelect && nextTrack.id !== previousTrack?.id) {
                            await saveMusic$(nextTrack, previousTrack);
                          }
                        }}
                      >
                        <div class={styles.albumArt} aria-hidden="true">
                          {track.artworkUrl ? (
                            <img
                              src={track.artworkUrl}
                              alt=""
                              width={56}
                              height={56}
                              class={styles.albumArtImage}
                            />
                          ) : (
                            <span>{getTrackLabel(track)}</span>
                          )}
                        </div>
                        <span class={styles.trackMeta}>
                          <span class={styles.trackTitle}>{track.title}</span>
                          <span class={styles.trackArtist}>{track.artist}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {saveOnSelect && isSaving.value && <p class={styles.placeholder}>保存中...</p>}
      {saveError.value && <p class={styles.placeholder}>{saveError.value}</p>}
      {!saveOnSelect && (
        <div class={formStyles.actions}>
          <FormButton
            type="button"
            variant="accent"
            size="md"
            width="full"
            disabled={isSaving.value || !canContinue}
            aria-busy={isSaving.value}
            onClick$={async () => {
              if (!selectedTrack.value) return;

              const previousTrack = initialTrack ? cloneTrack(initialTrack) : null;
              await saveMusic$(selectedTrack.value, previousTrack);
              if (saveError.value) return;
              await onNext$?.();
            }}
          >
            {isSaving.value ? "保存中..." : "次へ"}
          </FormButton>
        </div>
      )}
    </section>
  );
});

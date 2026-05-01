import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { FormButton } from "~/components/ui/form/form-button/form-button";
import inputStyles from "~/components/ui/form/form-text-input/form-text-input.module.css";
import { useToast } from "~/components/ui/toast/toast";
import type { MusicTrack } from "~/schema/music";
import formStyles from "~/routes/signup/index.module.css";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import styles from "./music-settings-form.module.css";

type MusicSearchResponse = {
  results: MusicTrack[];
};

type MusicSettingsFormProps = {
  initialTrack: MusicTrack | null;
};

const getTrackLabel = (track: Pick<MusicTrack, "title" | "artist">) =>
  `${track.title.slice(0, 1)}${track.artist.slice(0, 1)}`.toUpperCase();

export const MusicSettingsForm = component$<MusicSettingsFormProps>(({ initialTrack }) => {
  const query = useSignal("");
  const results = useSignal<MusicTrack[]>([]);
  const selectedTrack = useSignal<MusicTrack | null>(initialTrack);
  const isSearchActive = useSignal(false);
  const isComposing = useSignal(false);
  const isSearching = useSignal(false);
  const isSaving = useSignal(false);
  const searchError = useSignal<string | null>(null);
  const saveError = useSignal<string | null>(null);
  const toast = useToast();

  const normalizedQuery = query.value.trim().toLowerCase();

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
        const params = new URLSearchParams({ term: currentQuery });
        const response = await fetch(`/api/music/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("音楽の検索に失敗しました");
        }

        const data = (await response.json()) as MusicSearchResponse;
        results.value = data.results;
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
        <div class={styles.selectedTrackRow}>
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
                        onClick$={() => {
                          selectedTrack.value = track;
                          query.value = "";
                          results.value = [];
                          searchError.value = null;
                          saveError.value = null;
                          isSearchActive.value = false;
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

      {saveError.value && <p class={styles.placeholder}>{saveError.value}</p>}

      <div class={formStyles.actions}>
        <FormButton
          type="button"
          variant="accent"
          size="md"
          width="full"
          disabled={!selectedTrack.value || isSaving.value}
          aria-busy={isSaving.value}
          onClick$={async () => {
            if (!selectedTrack.value || isSaving.value) return;

            isSaving.value = true;
            saveError.value = null;

            try {
              const response = await fetch("/api/users/me/music", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ track: selectedTrack.value }),
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
              saveError.value = error instanceof Error ? error.message : "保存に失敗しました";
            } finally {
              isSaving.value = false;
            }
          }}
        >
          {isSaving.value ? "保存中..." : "保存する"}
        </FormButton>
      </div>
    </section>
  );
});

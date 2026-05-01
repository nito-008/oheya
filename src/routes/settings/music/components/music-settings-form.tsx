import { component$, useSignal } from "@builder.io/qwik";
import { Button } from "~/components/ui/button/button";
import formStyles from "~/routes/signup/index.module.css";
import sharedStyles from "~/routes/settings/components/settings-tabs/settings-tabs.module.css";
import inputStyles from "~/components/ui/form/form-text-input/form-text-input.module.css";
import styles from "./music-settings-form.module.css";

type MusicTrackOption = {
  id: string;
  title: string;
  artist: string;
  albumArt: {
    background: string;
    accent: string;
    label: string;
  };
};

const musicTrackOptions: MusicTrackOption[] = [
  {
    id: "1",
    title: "After the Rain",
    artist: "Maya Del Ray",
    albumArt: {
      background: "linear-gradient(135deg, #f86f6f, #ffd166)",
      accent: "#fff6dd",
      label: "AR",
    },
  },
  {
    id: "2",
    title: "Midnight Echo",
    artist: "The North Harbor",
    albumArt: {
      background: "linear-gradient(135deg, #2f4858, #5784ba)",
      accent: "#e8f1ff",
      label: "ME",
    },
  },
  {
    id: "3",
    title: "Blue Citrus",
    artist: "Luna Shibata",
    albumArt: {
      background: "linear-gradient(135deg, #ffb703, #219ebc)",
      accent: "#083344",
      label: "BC",
    },
  },
  {
    id: "4",
    title: "Velvet Summer",
    artist: "City Sunday",
    albumArt: {
      background: "linear-gradient(135deg, #9b5de5, #f15bb5)",
      accent: "#fff3fc",
      label: "VS",
    },
  },
  {
    id: "5",
    title: "Paper Moonlight",
    artist: "Aoi & The Lamps",
    albumArt: {
      background: "linear-gradient(135deg, #588157, #dad7cd)",
      accent: "#183a1d",
      label: "PM",
    },
  },
  {
    id: "6",
    title: "Static Bloom",
    artist: "Niki Kuroda",
    albumArt: {
      background: "linear-gradient(135deg, #0f172a, #22c55e)",
      accent: "#dcfce7",
      label: "SB",
    },
  },
] as const;

export const MusicSettingsForm = component$(() => {
  const query = useSignal("");
  const selectedTrackId = useSignal<string | null>(null);
  const isSearchActive = useSignal(false);
  const isComposing = useSignal(false);

  const normalizedQuery = query.value.trim().toLowerCase();
  const results = normalizedQuery
    ? musicTrackOptions.filter(
        (track) =>
          track.title.toLowerCase().includes(normalizedQuery) ||
          track.artist.toLowerCase().includes(normalizedQuery),
      )
    : [];
  const selectedTrack =
    musicTrackOptions.find((track) => track.id === selectedTrackId.value) ?? null;

  return (
    <section class={`${formStyles.form} ${sharedStyles.content} ${styles.panel}`}>
      {selectedTrack && (
        <div class={styles.selectedTrackRow}>
          <div
            class={styles.albumArt}
            style={{
              background: selectedTrack.albumArt.background,
              color: selectedTrack.albumArt.accent,
            }}
            aria-hidden="true"
          >
            <span>{selectedTrack.albumArt.label}</span>
          </div>
          <div class={styles.selectedMeta}>
            <strong>{selectedTrack.title}</strong>
            <span>{selectedTrack.artist}</span>
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
          <span class={inputStyles.label}>楽曲を検索</span>
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
            }}
          />
        </label>

        {isSearchActive.value && normalizedQuery && !isComposing.value && (
          <div class={styles.resultsCard} aria-live="polite">
            {normalizedQuery && results.length === 0 && (
              <p class={styles.placeholder}>該当する楽曲がありません。</p>
            )}

            {results.length > 0 && (
              <ul class={styles.resultsList}>
                {results.map((track) => {
                  const isSelected = track.id === selectedTrackId.value;

                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        class={{
                          [styles.resultButton]: true,
                          [styles.resultButtonSelected]: isSelected,
                        }}
                        onClick$={() => {
                          selectedTrackId.value = track.id;
                          query.value = "";
                          isSearchActive.value = false;
                        }}
                      >
                        <div
                          class={styles.albumArt}
                          style={{
                            background: track.albumArt.background,
                            color: track.albumArt.accent,
                          }}
                          aria-hidden="true"
                        >
                          <span>{track.albumArt.label}</span>
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

      <div class={formStyles.actions}>
        <Button type="button" variant="accent" size="md" width="full" disabled={!selectedTrack}>
          保存する
        </Button>
      </div>
    </section>
  );
});

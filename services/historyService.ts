import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@musicid/history';
const LEGACY_HISTORY_KEY = '@musicid/recognition-history';
const HISTORY_MIGRATED_KEY = '@musicid/history-migrated-v1';
const MAX_HISTORY_ITEMS = 50;

export interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  album_art: string;
  preview_url: string;
  timestamp: string;
}

function sortByLatest(items: HistoryTrack[]): HistoryTrack[] {
  return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function normalizeHistoryItem(value: unknown): HistoryTrack | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const track = value as Partial<HistoryTrack>;
  if (
    typeof track.id !== 'string' ||
    typeof track.title !== 'string' ||
    typeof track.artist !== 'string' ||
    typeof track.timestamp !== 'string'
  ) {
    return null;
  }

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album_art: typeof track.album_art === 'string' ? track.album_art : '',
    preview_url: typeof track.preview_url === 'string' ? track.preview_url : '',
    timestamp: track.timestamp,
  };
}

async function migrateLegacyHistoryIfNeeded(): Promise<void> {
  const migrated = await AsyncStorage.getItem(HISTORY_MIGRATED_KEY);
  if (migrated === 'true') {
    return;
  }

  const currentRaw = await AsyncStorage.getItem(HISTORY_KEY);
  const legacyRaw = await AsyncStorage.getItem(LEGACY_HISTORY_KEY);

  let currentItems: HistoryTrack[] = [];
  if (currentRaw) {
    try {
      const parsed = JSON.parse(currentRaw) as unknown[];
      if (Array.isArray(parsed)) {
        currentItems = parsed
          .map(normalizeHistoryItem)
          .filter((item): item is HistoryTrack => item !== null);
      }
    } catch {
      currentItems = [];
    }
  }

  let legacyItems: HistoryTrack[] = [];
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw) as unknown[];
      if (Array.isArray(parsed)) {
        legacyItems = parsed
          .map((entry): HistoryTrack | null => {
            if (!entry || typeof entry !== 'object') {
              return null;
            }

            const legacy = entry as {
              id?: string;
              title?: string;
              artist?: string;
              albumArtUri?: string;
              timestamp?: string;
            };

            if (
              typeof legacy.id !== 'string' ||
              typeof legacy.title !== 'string' ||
              typeof legacy.artist !== 'string' ||
              typeof legacy.timestamp !== 'string'
            ) {
              return null;
            }

            return {
              id: legacy.id,
              title: legacy.title,
              artist: legacy.artist,
              album_art: typeof legacy.albumArtUri === 'string' ? legacy.albumArtUri : '',
              preview_url: '',
              timestamp: legacy.timestamp,
            };
          })
          .filter((item): item is HistoryTrack => item !== null);
      }
    } catch {
      legacyItems = [];
    }
  }

  const combined = sortByLatest([...currentItems, ...legacyItems]).slice(0, MAX_HISTORY_ITEMS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(combined));
  await AsyncStorage.setItem(HISTORY_MIGRATED_KEY, 'true');
}

export async function getHistory(): Promise<HistoryTrack[]> {
  await migrateLegacyHistoryIfNeeded();

  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map(normalizeHistoryItem).filter((item): item is HistoryTrack => item !== null).slice(0, MAX_HISTORY_ITEMS);

    return sortByLatest(normalized);
  } catch {
    return [];
  }
}

export async function saveToHistory(track: HistoryTrack): Promise<void> {
  await migrateLegacyHistoryIfNeeded();

  const current = await getHistory();
  const deduped = current.filter(
    (item) => !(item.title === track.title && item.artist === track.artist && item.preview_url === track.preview_url)
  );

  const next = sortByLatest([track, ...deduped]).slice(0, MAX_HISTORY_ITEMS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

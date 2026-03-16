import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecognitionResult } from '@/types/recognition';

const HISTORY_KEY = '@musicid/recognition-history';
const MAX_HISTORY_ITEMS = 50;

export async function loadHistory(): Promise<RecognitionResult[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as RecognitionResult[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

export async function saveHistory(items: RecognitionResult[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
}

export async function appendHistory(item: RecognitionResult): Promise<void> {
  const current = await loadHistory();
  const next = [item, ...current.filter((historyItem) => historyItem.id !== item.id)];
  await saveHistory(next);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const current = await loadHistory();
  await saveHistory(current.filter((item) => item.id !== id));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

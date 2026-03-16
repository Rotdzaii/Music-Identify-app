/**
 * Music Recognition Utilities for React Native
 */

function hasIntlDateTime(): boolean {
  try {
    return typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function';
  } catch {
    return false;
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function fallbackDate(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Format time difference to human-readable string
 */
export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  if (hasIntlDateTime()) {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  return fallbackDate(date);
}

/**
 * Format time to HH:MM format
 */
export function formatTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (hasIntlDateTime()) {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Format date to readable format
 */
export function formatDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const showYear = date.getFullYear() !== now.getFullYear();

  if (hasIntlDateTime()) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      ...(showYear ? { year: 'numeric' } : {}),
    }).format(date);
  }

  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return showYear ? `${day}/${month}/${date.getFullYear()}` : `${day}/${month}`;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'song'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Language codes and names
 */
export const LANGUAGES = {
  en: { name: 'English', flag: 'GB' },
  vi: { name: 'Vietnamese', flag: 'VN' },
  es: { name: 'Spanish', flag: 'ES' },
  fr: { name: 'French', flag: 'FR' },
  de: { name: 'German', flag: 'DE' },
  ja: { name: 'Japanese', flag: 'JP' },
  zh: { name: 'Chinese', flag: 'CN' },
  ko: { name: 'Korean', flag: 'KR' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

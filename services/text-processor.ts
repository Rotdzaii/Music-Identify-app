const FILLER_WORDS = new Set([
  'a',
  'ah',
  'an',
  'and',
  'em',
  'erm',
  'hmm',
  'i',
  'la',
  'like',
  'na',
  'oh',
  'the',
  'to',
  'uh',
  'um',
  'va',
]);

/**
 * FR-04: Clean recognized lyrics before search.
 */
export function cleanLyrics(input: string): string {
  if (!input) {
    return '';
  }

  const withoutPunctuation = input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const normalizedSpaces = withoutPunctuation.replace(/\s+/g, ' ').trim();

  if (!normalizedSpaces) {
    return '';
  }

  return normalizedSpaces
    .split(' ')
    .filter((word) => word.length > 1 && !FILLER_WORDS.has(word))
    .join(' ')
    .trim();
}

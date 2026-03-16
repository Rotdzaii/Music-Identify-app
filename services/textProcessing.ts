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

export function cleanRecognizedText(input: string): string {
  if (!input) {
    return '';
  }

  const lower = input.toLowerCase();
  const withoutSpecialChars = lower.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const normalizedSpaces = withoutSpecialChars.replace(/\s+/g, ' ').trim();

  if (!normalizedSpaces) {
    return '';
  }

  return normalizedSpaces
    .split(' ')
    .filter((word) => word.length > 1 && !FILLER_WORDS.has(word))
    .join(' ')
    .trim();
}

export interface RecognitionResult {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  timestamp: string;
  language: string;
  audioUri?: string;
  albumArtUri?: string;
}

export interface SongMatch {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  language: string;
  matchedLyricsSnippet?: string;
  matchScore?: number;
  albumArtUri?: string;
}

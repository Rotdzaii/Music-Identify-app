import type { SongMatch } from '@/types/recognition';

const NETWORK_ERROR_MESSAGE = 'Network Error';

type SearchApiSongPayload = {
	id?: string;
	title?: string;
	songTitle?: string;
	name?: string;
	artist?: string;
	singer?: string;
	lyrics?: string;
	lyricSample?: string;
	matchedLyricsSnippet?: string;
	snippet?: string;
	language?: string;
	lang?: string;
	albumArtUri?: string;
	coverUrl?: string;
	matchScore?: number | string;
	score?: number | string;
};

function toStringOrEmpty(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function buildSongId(title: string, artist: string): string {
	const base = `${title}-${artist}`.trim().toLowerCase();
	return base.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `song-${Date.now()}`;
}

function mapSongPayload(songPayload: SearchApiSongPayload): SongMatch | null {
	const title = toStringOrEmpty(songPayload.title || songPayload.songTitle || songPayload.name);
	const artist = toStringOrEmpty(songPayload.artist || songPayload.singer);
	const lyrics = toStringOrEmpty(songPayload.lyrics || songPayload.lyricSample || songPayload.snippet);

	if (!title || !artist || !lyrics) {
		return null;
	}

	const matchScoreRaw = songPayload.matchScore ?? songPayload.score;
	const parsedScore =
		typeof matchScoreRaw === 'number'
			? matchScoreRaw
			: typeof matchScoreRaw === 'string' && matchScoreRaw.trim()
			? Number(matchScoreRaw)
			: undefined;

	return {
		id: toStringOrEmpty(songPayload.id) || buildSongId(title, artist),
		title,
		artist,
		lyrics,
		language: toStringOrEmpty(songPayload.language || songPayload.lang) || 'unknown',
		albumArtUri: toStringOrEmpty(songPayload.albumArtUri || songPayload.coverUrl) || undefined,
		matchedLyricsSnippet: toStringOrEmpty(songPayload.matchedLyricsSnippet || songPayload.snippet) || undefined,
		matchScore: Number.isFinite(parsedScore) ? parsedScore : undefined,
	};
}

function pickFirstSongPayload(payload: unknown): SearchApiSongPayload | null {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	if (Array.isArray(payload)) {
		return (payload[0] as SearchApiSongPayload) ?? null;
	}

	const response = payload as {
		result?: SearchApiSongPayload | SearchApiSongPayload[];
		results?: SearchApiSongPayload[];
		data?: SearchApiSongPayload | SearchApiSongPayload[];
		song?: SearchApiSongPayload;
		match?: SearchApiSongPayload;
	};

	if (Array.isArray(response.results)) {
		return response.results[0] ?? null;
	}

	if (Array.isArray(response.data)) {
		return response.data[0] ?? null;
	}

	if (Array.isArray(response.result)) {
		return response.result[0] ?? null;
	}

	if (response.song) {
		return response.song;
	}

	if (response.match) {
		return response.match;
	}

	if (response.data && !Array.isArray(response.data)) {
		return response.data;
	}

	if (response.result && !Array.isArray(response.result)) {
		return response.result;
	}

	return response as SearchApiSongPayload;
}

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const payload = await response.json();
		if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
			return payload.message;
		}
	} catch {
		// Continue to text fallback.
	}

	try {
		const text = await response.text();
		if (text.trim()) {
			return text.trim();
		}
	} catch {
		// Ignore and use generic fallback.
	}

	return `Search server error (${response.status})`;
}

export async function searchSongByLyrics(cleanedText: string): Promise<SongMatch | null> {
	if (!cleanedText.trim()) {
		return null;
	}

	const searchApiUrl = process.env.EXPO_PUBLIC_SEARCH_API_URL;
	if (!searchApiUrl) {
		throw new Error('Search API URL is not configured.');
	}

	let response: Response;
	try {
		response = await fetch(searchApiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				cleanedText,
			}),
		});
	} catch {
		throw new Error(NETWORK_ERROR_MESSAGE);
	}

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new Error('Search server did not return valid JSON.');
	}

	const firstSong = pickFirstSongPayload(payload);
	if (!firstSong) {
		return null;
	}

	return mapSongPayload(firstSong);
}

import { uploadAudio } from '@/services/apiService';

export interface SttSongMatch {
	title: string;
	artist: string;
	albumName: string;
	albumArt: string;
	previewUrl: string;
}

export interface SttResult {
	rawText: string;
	cleanedText: string;
	matches: SttSongMatch[];
}

export async function convertSpeechToText(audioUri: string, languageCode: string): Promise<string> {
	const result = await transcribeAudio(audioUri, languageCode);
	return result.rawText;
}

export async function transcribeAudio(audioUri: string, language: string): Promise<SttResult> {
	const response = await uploadAudio(audioUri, language);

	return {
		rawText: response.raw_text,
		cleanedText: response.cleaned_text,
		matches: response.matches.map((item) => ({
			title: item.title,
			artist: item.artist,
			albumName: item.album_name ?? '',
			albumArt: item.album_art ?? '',
			previewUrl: item.preview_url ?? '',
		})),
	};
}

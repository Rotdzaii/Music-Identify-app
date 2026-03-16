import { cleanLyrics } from '@/services/text-processor';

export interface SttResult {
	rawText: string;
	cleanedText: string;
}

const NETWORK_ERROR_MESSAGE = 'Network Error';

function extractTranscription(payload: unknown): string | null {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	const response = payload as {
		text?: string;
		transcript?: string;
		recognizedText?: string;
		result?: { text?: string; transcript?: string };
		data?: { text?: string; transcript?: string };
	};

	return (
		response.text ??
		response.transcript ??
		response.recognizedText ??
		response.result?.text ??
		response.result?.transcript ??
		response.data?.text ??
		response.data?.transcript ??
		null
	);
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

	return `STT server error (${response.status})`;
}

export async function convertSpeechToText(audioUri: string, languageCode: string): Promise<string> {
	if (!audioUri) {
		throw new Error('Missing audio file URI');
	}

	const sttApiUrl = process.env.EXPO_PUBLIC_STT_API_URL;
	if (!sttApiUrl) {
		throw new Error('STT API URL is not configured.');
	}

	const formData = new FormData();
	formData.append(
		'audio',
		{
			uri: audioUri,
			name: 'recording.m4a',
			type: 'audio/m4a',
		} as unknown as Blob
	);
	formData.append('languageCode', languageCode);

	let response: Response;
	try {
		response = await fetch(sttApiUrl, {
			method: 'POST',
			body: formData,
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
		throw new Error('STT server did not return valid JSON.');
	}

	const recognizedText = extractTranscription(payload)?.trim();
	if (!recognizedText) {
		throw new Error('STT server did not return recognized text.');
	}

	return recognizedText;
}

export async function transcribeAudio(audioUri: string, language: string): Promise<SttResult> {
	const rawText = await convertSpeechToText(audioUri, language);

	return {
		rawText,
		cleanedText: cleanLyrics(rawText),
	};
}

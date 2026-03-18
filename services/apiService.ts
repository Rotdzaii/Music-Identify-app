import { Platform } from 'react-native';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://127.0.0.1:8000/api/v1';
      }
      return `http://${host}:8000/api/v1`;
    }

    return 'http://127.0.0.1:8000/api/v1';
  }

  // Default LAN host for mobile devices in local network.
  return 'http://10.7.128.240:8000/api/v1';
}

export const BASE_URL = resolveBaseUrl();

export type ApiErrorCode = 'NETWORK' | 'NO_SPEECH' | 'NO_MATCH' | 'UNKNOWN';

export interface SttApiMatch {
  title: string;
  artist: string;
  album_name?: string | null;
  album_art?: string | null;
  preview_url?: string | null;
}

export interface SttApiResponse {
  raw_text: string;
  cleaned_text: string;
  matches: SttApiMatch[];
}

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function inferAudioMeta(audioUri: string): { name: string; type: string } {
  const defaultName = 'recording.m4a';
  const uriName = audioUri.split('/').pop() || defaultName;
  const extension = uriName.includes('.') ? uriName.split('.').pop()?.toLowerCase() : 'm4a';

  switch (extension) {
    case 'wav':
      return { name: uriName, type: 'audio/wav' };
    case 'mp3':
      return { name: uriName, type: 'audio/mpeg' };
    case 'aac':
      return { name: uriName, type: 'audio/aac' };
    case 'm4a':
    default:
      return { name: uriName, type: 'audio/m4a' };
  }
}

function inferFileExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'audio/webm':
      return 'webm';
    case 'audio/mp4':
    case 'audio/m4a':
      return 'm4a';
    case 'audio/wav':
      return 'wav';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/aac':
      return 'aac';
    default:
      return 'm4a';
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      if ('detail' in payload && Array.isArray(payload.detail) && payload.detail.length > 0) {
        const firstDetail = payload.detail[0] as { msg?: string };
        if (firstDetail && typeof firstDetail.msg === 'string') {
          return firstDetail.msg;
        }
      }
      if ('detail' in payload && typeof payload.detail === 'string') {
        return payload.detail;
      }
      if ('message' in payload && typeof payload.message === 'string') {
        return payload.message;
      }
    }
  } catch {
    // Ignore invalid JSON and fallback.
  }

  return '';
}

export async function uploadAudio(audioUri: string, languageCode?: string): Promise<SttApiResponse> {
  if (!audioUri) {
    throw new ApiError('UNKNOWN', 'Missing audio file URI.');
  }

  const formData = new FormData();
  const audioMeta = inferAudioMeta(audioUri);

  if (Platform.OS === 'web') {
    try {
      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      const detectedType = audioBlob.type || audioMeta.type;
      const detectedExtension = inferFileExtensionFromMime(detectedType);
      const webFileName = `recording.${detectedExtension}`;
      const audioFile = new File([audioBlob], webFileName, { type: detectedType });
      formData.append('audio', audioFile);
    } catch {
      throw new ApiError('UNKNOWN', 'Không thể đọc file âm thanh trên trình duyệt');
    }
  } else {
    formData.append(
      'audio',
      {
        uri: audioUri,
        name: audioMeta.name,
        type: audioMeta.type,
      } as unknown as Blob
    );
  }

  if (languageCode) {
    formData.append('languageCode', languageCode);
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    response = await fetch(`${BASE_URL}/stt`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('NETWORK', 'Không thể kết nối với máy chủ');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    const noSpeech = response.status === 422 || detail.includes('Không thể nhận diện được lời thoại');
    const noMatch = response.status === 404 || detail.includes('Không tìm thấy bài hát phù hợp');

    if (noSpeech) {
      throw new ApiError('NO_SPEECH', 'Không thể nhận diện được lời thoại', response.status);
    }

    if (noMatch) {
      throw new ApiError('NO_MATCH', 'Không tìm thấy bài hát phù hợp', response.status);
    }

    throw new ApiError('UNKNOWN', detail || 'Không thể kết nối với máy chủ', response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError('UNKNOWN', 'Không thể kết nối với máy chủ', response.status);
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as SttApiResponse).raw_text !== 'string' ||
    typeof (payload as SttApiResponse).cleaned_text !== 'string' ||
    !Array.isArray((payload as SttApiResponse).matches)
  ) {
    throw new ApiError('NO_SPEECH', 'Không thể nhận diện được lời thoại', response.status);
  }

  return payload as SttApiResponse;
}
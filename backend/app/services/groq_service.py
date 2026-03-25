from __future__ import annotations

import os
import string
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

HALLUCINATION_BLACKLIST = {
    "thank you",
    "thanks for watching",
    "you",
    "thì",
}

LLM_NOISE_PREFIXES = (
    "bài hát:",
    "song:",
    "tôi nghĩ là",
)

LLM_SONG_MODELS = (
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
)

LLM_SYSTEM_PROMPT = (
    "You are an expert in Vietnamese music. I will give you a short lyrics snippet. "
    "You MUST guess the most likely song it belongs to, even if you are not 100% sure. "
    "Reply ONLY in this exact format: 'Song Title - Artist'. "
    "Do not add any extra words, explanations, or quotes. "
    "If it's complete gibberish and absolutely impossible to guess, reply 'UNKNOWN'."
)


class GroqTranscriptionError(RuntimeError):
    pass


def _normalize_transcript_for_filter(text: str) -> str:
    normalized = (text or "").strip().lower()
    return normalized.strip(string.whitespace + string.punctuation + "“”‘’…")


def _clean_llm_song_output(raw_text: str) -> str:
    cleaned = (raw_text or "").strip().strip('"\'')
    lowered = cleaned.lower()

    for prefix in LLM_NOISE_PREFIXES:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
            lowered = cleaned.lower()
            break

    if ":" in cleaned:
        cleaned = cleaned.split(":", 1)[1].strip()

    cleaned = cleaned.strip().strip('"\'')
    return cleaned


def transcribe_audio_fallback(file_path: str) -> str:
    audio_path = Path(file_path)
    if not audio_path.exists() or not audio_path.is_file():
        raise GroqTranscriptionError("Không tìm thấy file audio để bóc băng")

    try:
        with audio_path.open("rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(audio_path.name, audio_file.read()),
                model="whisper-large-v3",
            )
    except Exception as exc:
        raise GroqTranscriptionError("Không thể bóc băng audio bằng Groq") from exc

    text = str(getattr(transcription, "text", "") or "").strip()
    if not text and isinstance(transcription, dict):
        text = str(transcription.get("text") or "").strip()

    normalized_text = _normalize_transcript_for_filter(text)
    if not normalized_text or normalized_text in HALLUCINATION_BLACKLIST:
        return ""

    return text


def identify_song_from_lyrics(lyrics_text: str) -> str:
    prompt_text = (lyrics_text or "").strip()
    if not prompt_text:
        return "UNKNOWN"

    completion = None
    for model_name in LLM_SONG_MODELS:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                temperature=0,
                messages=[
                    {
                        "role": "system",
                        "content": LLM_SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": prompt_text,
                    },
                ],
            )
            break
        except Exception:
            completion = None

    if completion is None:
        return "UNKNOWN"

    choices = getattr(completion, "choices", None) or []
    if not choices:
        return "UNKNOWN"

    message = getattr(choices[0], "message", None)
    content = str(getattr(message, "content", "") or "").strip()
    if not content:
        return "UNKNOWN"

    first_line = content.splitlines()[0].strip()
    normalized = _clean_llm_song_output(first_line)
    if normalized.upper() == "UNKNOWN":
        return "UNKNOWN"

    if " - " not in normalized:
        return "UNKNOWN"

    return normalized

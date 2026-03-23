from __future__ import annotations

from typing import Any

import requests

LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"
DEFAULT_LYRICS_VI = "Không tìm thấy lời cho bài hát này."
DEFAULT_LYRICS_EN = "Lyrics were not found for this song."


def _default_lyrics(language_code: str | None = None) -> str:
    code = (language_code or "").strip().lower()
    return DEFAULT_LYRICS_EN if code.startswith("en") else DEFAULT_LYRICS_VI


def fetch_lyrics(title: str, artist: str, language_code: str | None = None) -> str:
    query = f"{(title or '').strip()} {(artist or '').strip()}".strip()
    if not query:
        return _default_lyrics(language_code)

    try:
        response = requests.get(
            LRCLIB_SEARCH_URL,
            params={"q": query},
            timeout=10,
        )
        response.raise_for_status()
        payload: Any = response.json()
    except Exception:
        return _default_lyrics(language_code)

    if not isinstance(payload, list) or not payload:
        return _default_lyrics(language_code)

    first_item = payload[0]
    if not isinstance(first_item, dict):
        return _default_lyrics(language_code)

    lyrics = str(first_item.get("plainLyrics") or "").strip()
    return lyrics or _default_lyrics(language_code)

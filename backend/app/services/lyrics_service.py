from __future__ import annotations

from typing import Any

import requests

LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"
DEFAULT_LYRICS_MESSAGE = "Đã nhận diện giai điệu. Không tìm thấy lời bài hát."


def _first_four_lines(plain_lyrics: str) -> str:
    lines = [line.strip() for line in plain_lyrics.split("\n") if line.strip()]
    return "\n".join(lines[:4]).strip()


def fetch_lyrics(title: str, artist: str) -> str:
    query = f"{(title or '').strip()} {(artist or '').strip()}".strip()
    if not query:
        return DEFAULT_LYRICS_MESSAGE

    try:
        response = requests.get(
            LRCLIB_SEARCH_URL,
            params={"q": query},
            timeout=10,
        )
        response.raise_for_status()
        payload: Any = response.json()
    except Exception:
        return DEFAULT_LYRICS_MESSAGE

    if not isinstance(payload, list) or not payload:
        return DEFAULT_LYRICS_MESSAGE

    first_item = payload[0]
    if not isinstance(first_item, dict):
        return DEFAULT_LYRICS_MESSAGE

    lyrics = str(first_item.get("plainLyrics") or "").strip()
    if not lyrics:
        return DEFAULT_LYRICS_MESSAGE

    preview = _first_four_lines(lyrics)
    return preview or DEFAULT_LYRICS_MESSAGE

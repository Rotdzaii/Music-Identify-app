from __future__ import annotations

import json
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

ITUNES_SEARCH_URL = "https://itunes.apple.com/search"


def _normalize_match(item: dict[str, Any]) -> dict[str, str | None] | None:
    title = str(item.get("trackName") or "").strip()
    artist = str(item.get("artistName") or "").strip()

    if not title or not artist:
        return None

    return {
        "title": title,
        "artist": artist,
        "album_name": str(item.get("collectionName") or "").strip() or None,
        "album_art": str(item.get("artworkUrl100") or "").strip() or None,
        "preview_url": str(item.get("previewUrl") or "").strip() or None,
    }


def search_songs(query: str) -> list[dict[str, str | None]]:
    clean_query = (query or "").strip()
    if not clean_query:
        return []

    query_string = urlencode(
        {
            "term": clean_query,
            "entity": "song",
            "limit": 5,
        }
    )

    url = f"{ITUNES_SEARCH_URL}?{query_string}"

    try:
        with urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return []

    results = payload.get("results") if isinstance(payload, dict) else None
    if not isinstance(results, list):
        return []

    matches: list[dict[str, str | None]] = []
    for item in results:
        if not isinstance(item, dict):
            continue

        normalized = _normalize_match(item)
        if normalized:
            matches.append(normalized)

    return matches
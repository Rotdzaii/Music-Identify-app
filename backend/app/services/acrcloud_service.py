from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

HTTP_METHOD = "POST"
HTTP_URI = "/v1/identify"
DATA_TYPE = "audio"
SIGNATURE_VERSION = "1"


class ACRCloudRecognitionError(RuntimeError):
    pass


def _read_acr_env() -> tuple[str, str, str]:
    host = (os.getenv("ACR_HOST") or "").strip()
    access_key = (os.getenv("ACR_ACCESS_KEY") or "").strip()
    access_secret = (os.getenv("ACR_ACCESS_SECRET") or "").strip()

    if not host or not access_key or not access_secret:
        raise ACRCloudRecognitionError("Thiếu cấu hình ACRCloud trong file .env")

    return host, access_key, access_secret


def _build_signature(access_key: str, access_secret: str, timestamp: str) -> str:
    string_to_sign = "\n".join(
        [
            HTTP_METHOD,
            HTTP_URI,
            access_key,
            DATA_TYPE,
            SIGNATURE_VERSION,
            timestamp,
        ]
    )

    digest = hmac.new(
        access_secret.encode("utf-8"),
        string_to_sign.encode("utf-8"),
        hashlib.sha1,
    ).digest()

    return base64.b64encode(digest).decode("utf-8")


def _coerce_audio_bytes(file_path_or_bytes: str | bytes | bytearray) -> bytes:
    if isinstance(file_path_or_bytes, (bytes, bytearray)):
        return bytes(file_path_or_bytes)

    file_path = Path(file_path_or_bytes)
    if not file_path.exists() or not file_path.is_file():
        raise ACRCloudRecognitionError("Không tìm thấy file audio để nhận diện")

    return file_path.read_bytes()


def _normalize_url(host: str) -> str:
    clean_host = host.replace("https://", "").replace("http://", "").strip("/")
    return f"https://{clean_host}{HTTP_URI}"


def recognize_audio(file_path_or_bytes: str | bytes | bytearray) -> dict[str, str] | None:
    host, access_key, access_secret = _read_acr_env()
    audio_bytes = _coerce_audio_bytes(file_path_or_bytes)

    if not audio_bytes:
        raise ACRCloudRecognitionError("File audio rỗng")

    timestamp = str(int(time.time()))
    signature = _build_signature(access_key, access_secret, timestamp)

    data = {
        "access_key": access_key,
        "data_type": DATA_TYPE,
        "signature": signature,
        "signature_version": SIGNATURE_VERSION,
        "timestamp": timestamp,
        "sample_bytes": str(len(audio_bytes)),
    }

    files = {
        "sample": ("sample.webm", audio_bytes, "audio/webm"),
    }

    try:
        response = requests.post(
            _normalize_url(host),
            data=data,
            files=files,
            timeout=20,
        )
    except requests.RequestException as exc:
        raise ACRCloudRecognitionError("Không thể kết nối đến ACRCloud") from exc

    try:
        payload: dict[str, Any] = response.json()
    except ValueError as exc:
        raise ACRCloudRecognitionError("ACRCloud trả về dữ liệu không hợp lệ") from exc

    if response.status_code >= 400:
        raise ACRCloudRecognitionError("ACRCloud trả về lỗi máy chủ")

    status = payload.get("status") if isinstance(payload, dict) else None
    if not isinstance(status, dict):
        return None

    if status.get("code") != 0:
        return None

    metadata = payload.get("metadata") if isinstance(payload, dict) else None
    music_list = metadata.get("music") if isinstance(metadata, dict) else None
    if not isinstance(music_list, list) or not music_list:
        return None

    top = music_list[0] if isinstance(music_list[0], dict) else None
    if not isinstance(top, dict):
        return None

    title = str(top.get("title") or "").strip()
    artists = top.get("artists")
    artist_name = ""
    if isinstance(artists, list) and artists and isinstance(artists[0], dict):
        artist_name = str(artists[0].get("name") or "").strip()

    if not title or not artist_name:
        return None

    return {
        "title": title,
        "artist": artist_name,
    }
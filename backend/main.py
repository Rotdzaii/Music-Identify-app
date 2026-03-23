import logging
from pathlib import Path
from uuid import uuid4

from app.services.acrcloud_service import (ACRCloudRecognitionError,
                                           recognize_audio)
from app.services.lyrics_service import fetch_lyrics
from app.services.search import search_songs
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

NO_RECOGNITION_MESSAGE = "Không nhận diện được bài hát từ audio"

logger = logging.getLogger(__name__)

app = FastAPI(title="MusicIdApp Backend")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}


@app.post("/api/v1/stt")
async def speech_to_text(
	audio: UploadFile = File(..., alias="audio"),
	language: str | None = Form(default=None, alias="languageCode"),
) -> dict[str, object]:
	suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
	file_path = UPLOAD_DIR / f"{uuid4().hex}{suffix}"

	try:
		with file_path.open("wb") as buffer:
			content = await audio.read()
			buffer.write(content)

		# Lưu file gốc để Tech Lead nghe lại.
		with (BASE_DIR / "debug_raw_audio.webm").open("wb") as debug_file:
			debug_file.write(content)

		recognized = recognize_audio(content)
		if not recognized:
			raise HTTPException(status_code=404, detail=NO_RECOGNITION_MESSAGE)

		title = recognized["title"]
		artist = recognized["artist"]
		cleaned_text = f"{title} - {artist}"

		matches = search_songs(f"{title} {artist}")
		if not matches:
			matches = search_songs(title)

		lyrics = fetch_lyrics(title, artist, language)

		response_matches = [
			{
				"title": match["title"],
				"artist": match["artist"],
				"album_name": match["album_name"],
				"album_art": match["album_art"],
				"preview_url": match["preview_url"],
			}
			for match in matches
		]

		return {
			"raw_text": lyrics,
			"cleaned_text": cleaned_text,
			"matches": response_matches,
		}
	except ACRCloudRecognitionError as exc:
		logger.exception("ACRCloud recognition failure")
		raise HTTPException(status_code=500, detail=str(exc) or "Không thể nhận diện bài hát")
	except HTTPException:
		raise
	except Exception as exc:
		logger.exception("Unexpected STT endpoint failure")
		raise HTTPException(status_code=500, detail="Không thể tìm kiếm bài hát") from exc
	finally:
		await audio.close()

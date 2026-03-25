import logging
import os
from pathlib import Path
from uuid import uuid4

from app.services.acrcloud_service import (ACRCloudRecognitionError,
                                           recognize_audio)
from app.services.groq_service import (GroqTranscriptionError,
                                       identify_song_from_lyrics,
                                       transcribe_audio_fallback)
from app.services.lyrics_service import fetch_lyrics
from app.services.search import search_songs
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

NO_RECOGNITION_MESSAGE = "Không nhận diện được bài hát từ audio"
NO_MATCH_MESSAGE = "Không tìm thấy bài hát phù hợp"

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

		recognized: dict[str, str] | None = None
		try:
			recognized = recognize_audio(str(file_path))
		except ACRCloudRecognitionError as exc:
			logger.warning("ACRCloud recognition failed, switching to Groq fallback: %s", exc)

		raw_text = ""
		cleaned_text = ""
		matches: list[dict[str, str | None]] = []

		if recognized:
			title = recognized["title"]
			artist = recognized["artist"]
			cleaned_text = f"{title} - {artist}"

			matches = search_songs(f"{title} {artist}")
			if not matches:
				matches = search_songs(title)

			lyrics = fetch_lyrics(title, artist)
			raw_text = lyrics or cleaned_text
		else:
			transcript = transcribe_audio_fallback(str(file_path))
			if transcript == "":
				return {
					"raw_text": "Không phát hiện được âm thanh hoặc lời bài hát rõ ràng.",
					"cleaned_text": "Lỗi nhận diện",
					"matches": [],
				}

			raw_text = transcript
			song_query = identify_song_from_lyrics(transcript)
			print(f"--- [DEBUG] LLM OUTPUT: '{song_query}' ---")
			if song_query == "UNKNOWN":
				return {
					"raw_text": transcript,
					"cleaned_text": "Không tìm thấy bài nhạc tương ứng.",
					"matches": [],
				}

			optimized_query = song_query.split("-", 1)[0].strip() if "-" in song_query else song_query
			search_query = optimized_query or song_query
			matches = search_songs(search_query)
			if not matches:
				return {
					"raw_text": transcript,
					"cleaned_text": "Không tìm thấy bài nhạc tương ứng.",
					"matches": [],
				}

			first_match = matches[0]
			first_title = str(first_match.get("title") or "").strip()
			first_artist = str(first_match.get("artist") or "").strip()
			if first_title and first_artist:
				cleaned_text = f"{first_title} - {first_artist}"
			else:
				cleaned_text = song_query

		if not matches:
			raise HTTPException(status_code=404, detail=NO_MATCH_MESSAGE)

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
			"raw_text": raw_text,
			"cleaned_text": cleaned_text,
			"matches": response_matches,
		}
	except GroqTranscriptionError as exc:
		logger.exception("Groq fallback transcription failure")
		raise HTTPException(status_code=500, detail=str(exc) or "Không thể nhận diện lời hát")
	except HTTPException:
		raise
	except Exception as exc:
		logger.exception("Unexpected STT endpoint failure")
		raise HTTPException(status_code=500, detail="Không thể tìm kiếm bài hát") from exc
	finally:
		await audio.close()
		if file_path.exists():
			try:
				os.remove(file_path)
			except OSError:
				logger.warning("Cannot remove temp audio file: %s", file_path)

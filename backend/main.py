import logging
from pathlib import Path
from uuid import uuid4

from app.services.search import search_songs
from app.services.stt import NO_SPEECH_MESSAGE, transcribe_audio
from app.utils.text_processor import clean_lyrics
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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

		raw_text = transcribe_audio(str(file_path), language)
		if not raw_text.strip():
			raise ValueError(NO_SPEECH_MESSAGE)

		cleaned_text = clean_lyrics(raw_text)
		if not cleaned_text.strip():
			raise ValueError(NO_SPEECH_MESSAGE)

		matches = search_songs(cleaned_text)
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
	except ValueError as exc:
		raise HTTPException(status_code=422, detail=str(exc) or NO_SPEECH_MESSAGE)
	except RuntimeError as exc:
		logger.exception("STT runtime failure")
		raise HTTPException(status_code=500, detail=str(exc) or "Lỗi STT nội bộ")
	except HTTPException:
		raise
	except Exception as exc:
		logger.exception("Unexpected STT endpoint failure")
		raise HTTPException(status_code=500, detail="Không thể tìm kiếm bài hát") from exc
	finally:
		await audio.close()

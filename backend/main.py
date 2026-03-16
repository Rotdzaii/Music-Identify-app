from pathlib import Path
from uuid import uuid4

from app.services.stt import NO_SPEECH_MESSAGE, transcribe_audio
from app.utils.text_processor import clean_lyrics
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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
) -> dict[str, str]:
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

		return {"raw_text": raw_text, "cleaned_text": cleaned_text}
	except ValueError:
		raise HTTPException(status_code=422, detail=NO_SPEECH_MESSAGE)
	except Exception as exc:
		raise HTTPException(status_code=500, detail=NO_SPEECH_MESSAGE) from exc
	finally:
		await audio.close()

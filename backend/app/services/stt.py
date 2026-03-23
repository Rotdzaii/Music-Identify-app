from functools import lru_cache
from typing import Any, Dict

NO_SPEECH_MESSAGE = "Không thể nhận diện được lời thoại"


def _resolve_initial_prompt(language: str | None, initial_prompt: str | None = None) -> str | None:
    if initial_prompt and initial_prompt.strip():
        return initial_prompt.strip()

    normalized = (language or "").strip().lower()
    if normalized.startswith("vi"):
        return "Đây là lời bài hát tiếng Việt"
    if normalized.startswith("en"):
        return "These are lyrics of an English song"

    return None


@lru_cache(maxsize=1)
def _get_whisperx_model() -> Any:
    import whisperx

    try:
        # Force CPU to match deployed environment and avoid CUDA/DLL issues.
        device = "cpu"
        compute_type = "int8"
        return whisperx.load_model("base", device=device, compute_type=compute_type)
    except OSError as exc:
        raise RuntimeError("Lỗi môi trường PyTorch/CUDA (DLL)") from exc


@lru_cache(maxsize=1)
def _get_faster_whisper_model() -> Any:
    from faster_whisper import WhisperModel

    # CPU-only configuration for local demo stability.
    return WhisperModel("base", device="cpu", compute_type="int8")


def _transcribe_with_whisperx(
    file_path: str,
    language: str | None = None,
    vad_filter: bool = True,
    initial_prompt: str | None = None,
) -> str:
    import whisperx

    model = _get_whisperx_model()
    audio = whisperx.load_audio(file_path)

    options: Dict[str, Any] = {
        "batch_size": 16,
        "vad_filter": vad_filter,
    }
    if language:
        options["language"] = language
    if initial_prompt:
        options["initial_prompt"] = initial_prompt

    result = model.transcribe(audio, **options)

    segments = result.get("segments") or []
    text = (result.get("text") or "").strip()

    if not text and segments:
        text = " ".join((segment.get("text") or "").strip() for segment in segments).strip()

    if not text:
        raise ValueError(NO_SPEECH_MESSAGE)

    return text


def _transcribe_with_faster_whisper(
    file_path: str,
    language: str | None = None,
    vad_filter: bool = True,
    initial_prompt: str | None = None,
) -> str:
    model = _get_faster_whisper_model()

    segments, _ = model.transcribe(
        file_path,
        language=language or None,
        vad_filter=vad_filter,
        initial_prompt=initial_prompt,
        beam_size=1,
        condition_on_previous_text=False,
    )

    text = " ".join((segment.text or "").strip() for segment in segments).strip()
    if not text:
        raise ValueError(NO_SPEECH_MESSAGE)

    return text


def transcribe_audio(
    file_path: str,
    language: str | None = None,
    initial_prompt: str | None = None,
) -> str:
    failures: list[Exception] = []
    resolved_prompt = _resolve_initial_prompt(language, initial_prompt)

    for vad_filter in (True, False):
        try:
            return _transcribe_with_whisperx(
                file_path,
                language,
                vad_filter=vad_filter,
                initial_prompt=resolved_prompt,
            )
        except Exception as exc:
            failures.append(exc)

    for vad_filter in (True, False):
        try:
            return _transcribe_with_faster_whisper(
                file_path,
                language,
                vad_filter=vad_filter,
                initial_prompt=resolved_prompt,
            )
        except Exception as exc:
            failures.append(exc)

    details = " | ".join(str(item) for item in failures if str(item))
    details_casefold = details.casefold()

    if any(isinstance(item, ValueError) and str(item) == NO_SPEECH_MESSAGE for item in failures):
        raise ValueError(NO_SPEECH_MESSAGE)

    if "ffmpeg" in details_casefold or "invalid data" in details_casefold or "codec" in details_casefold:
        raise RuntimeError("Không thể xử lý định dạng audio đầu vào")

    if "whisperx" in details_casefold or "torch" in details_casefold or "model" in details_casefold:
        raise RuntimeError("Không thể khởi tạo mô hình STT trên server")

    if details:
        raise RuntimeError(f"Lỗi xử lý STT nội bộ: {details}")

    raise RuntimeError("Lỗi xử lý STT nội bộ")
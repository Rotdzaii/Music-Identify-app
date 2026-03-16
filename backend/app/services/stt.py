from functools import lru_cache
from typing import Any, Dict

NO_SPEECH_MESSAGE = "Không thể nhận diện được lời thoại"


@lru_cache(maxsize=1)
def _get_model() -> Any:
    try:
        import torch
        import whisperx
    except Exception as exc:
        raise RuntimeError("Không thể tải thư viện STT (torch/whisperx)") from exc

    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        return whisperx.load_model("base", device=device, compute_type=compute_type)
    except OSError as exc:
        raise RuntimeError("Lỗi môi trường PyTorch/CUDA (DLL)") from exc


def transcribe_audio(file_path: str, language: str | None = None) -> str:
    try:
        import whisperx
    except Exception as exc:
        raise RuntimeError("Không thể tải thư viện whisperx") from exc

    model = _get_model()
    audio = whisperx.load_audio(file_path)

    options: Dict[str, Any] = {
        "batch_size": 16,
        "vad_filter": True,
    }
    if language:
        options["language"] = language

    result = model.transcribe(audio, **options)

    text = (result.get("text") or "").strip()
    segments = result.get("segments") or []

    if not text and not segments:
        raise ValueError(NO_SPEECH_MESSAGE)

    return text
"""
Local Whisper transcription server per DICTIONARY.md.

Dependency install (recommended in a dedicated venv):
  pip install fastapi uvicorn python-multipart faster-whisper torch

Runs on http://localhost:8000 with POST /transcribe accepting multipart field "audio"
and optional Form field language_code — matching lib/whisper.ts.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

try:
    from faster_whisper import WhisperModel  # type: ignore
except ImportError:
    WhisperModel = None


app = FastAPI(title="LangLegacy Whisper", version="1.0.0")
_model_cache: WhisperModel | None = None


def _load_model():
    global _model_cache
    if WhisperModel is None:
        raise HTTPException(status_code=503, detail="faster-whisper is not installed in this Python environment.")

    if _model_cache is None:
        # Defaults favor CPU: `device=auto` often picks CUDA and then fails on machines
        # without a full CUDA/cuBLAS stack (e.g. cublas64_12.dll missing on Windows).
        import os

        size = os.environ.get("WHISPER_MODEL_SIZE", "small")
        device = (os.environ.get("WHISPER_DEVICE") or "cpu").strip()
        compute_type = (os.environ.get("WHISPER_COMPUTE") or "").strip()
        if not compute_type or compute_type == "auto":
            compute_type = "int8" if device.lower() == "cpu" else "float16"
        print(f"[whisper_server] model={size!r} device={device!r} compute_type={compute_type!r}", flush=True)
        _model_cache = WhisperModel(size, device=device, compute_type=compute_type)
    return _model_cache


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language_code: str = Form("")):
    if WhisperModel is None:
        raise HTTPException(status_code=503, detail="faster-whisper is not installed")

    suffix = Path(audio.filename or "recording").suffix.lower()
    if suffix not in {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".mp4"}:
        suffix = ".webm"

    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty audio payload")

    path: Path | None = None
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        tmp.flush()
        path = Path(tmp.name)

    try:
        model = _load_model()
        lang_hint = language_code.strip()[:8] if language_code.strip() else None
        segments, info = model.transcribe(str(path), language=lang_hint)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {
            "transcript": text,
            "language_code": language_code or getattr(info, "language", "") or "",
        }
    except HTTPException:
        raise
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=503, detail=f"transcription failed: {exc}") from exc
    finally:
        if path is not None:
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("WHISPER_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

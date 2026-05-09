from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import os
import tempfile
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

def load_model():
    # Prefer GPU when available; fallback to CPU for portability.
    try:
        return WhisperModel("base", device="cuda", compute_type="float16")
    except Exception:
        return WhisperModel("base", device="cpu", compute_type="int8")


model = load_model()


def transcribe_with_model(audio_path: str, language_code: str | None):
    segments, _ = model.transcribe(audio_path, language=language_code if language_code else None)
    return list(segments)


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language_code: str = Form(default=None)):
    global model
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        try:
            segments = transcribe_with_model(tmp_path, language_code)
        except RuntimeError as exc:
            # Some Windows setups can construct a CUDA model but fail at first run.
            if "cublas64_12.dll" not in str(exc):
                raise
            model = WhisperModel("base", device="cpu", compute_type="int8")
            segments = transcribe_with_model(tmp_path, language_code)
        transcript = " ".join(segment.text for segment in segments).strip()
        return {"transcript": transcript, "language_code": language_code or ""}
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

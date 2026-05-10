# LangLegacy — Quickstart

Run the Next.js app and the local Whisper server in **two terminals**. Secrets stay in `.env.local` only (never commit that file).

## Prerequisites

- **Node.js** 18+ (20 LTS is fine)
- **Python** 3.10–3.13 (for `whisper_server.py`)
- Accounts / services: IBM watsonx, IBM Cloudant, Cloudinary (unsigned upload preset), and a Cloudant IAM API key or equivalent access

## 1. Install the web app

```bash
cd LangLegacy
npm install
```

## 2. Environment variables

Create `.env.local` in the project root (same folder as `package.json`) with:

```env
# IBM watsonx
WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Cloudant (use an API key exchanged for IAM Bearer — same pattern as the app)
CLOUDANT_URL=
CLOUDANT_API_KEY=

# Cloudinary (unsigned upload preset)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET=

# Local Whisper HTTP API — URL must match where whisper_server.py listens (below)
WHISPER_SERVER_URL=http://127.0.0.1:8000
```

Use your real values; see `BUILD.md` for fuller context on IBM / Cloudinary setup.

The Next.js app **does not** bundle Whisper. It calls your machine over HTTP (`lib/whisper.ts` → `WHISPER_SERVER_URL`), so transcription is **always** “local” as long as that URL points to `whisper_server.py` on your network.

## 3. Whisper server (Python, local)

One-time setup:

```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

**Start Whisper** (leave this running; separate terminal from Next):

```bash
npm run whisper
```

That runs `python whisper_server.py` (FastAPI + **faster-whisper** on **http://0.0.0.0:8000** → use `http://127.0.0.1:8000` in `WHISPER_SERVER_URL`). If `python` is not on your PATH on Windows, use `py whisper_server.py` after activating the venv.

Optional tuning (set in the **same** shell before `npm run whisper`, or export in your profile):

| Variable | Default | Notes |
|----------|---------|--------|
| `WHISPER_MODEL_SIZE` | `small` | `tiny` / `base` = faster on CPU, less accurate; `medium` if you have GPU RAM |
| `WHISPER_DEVICE` | **`cpu`** | Use `cuda` only when GPU + CUDA/cuBLAS are installed correctly |
| `WHISPER_COMPUTE` | **`int8`** on CPU | With `cuda`, try `float16`; unset/`auto` picks `int8` (CPU) or `float16` (CUDA) |
| `WHISPER_PORT` | `8000` | If you change this, set `WHISPER_SERVER_URL` to the same port |

Smoke-test: `curl http://127.0.0.1:8000/health` → `{"ok":true}`.

First transcription may download the model once (slower cold start). If the app says it cannot reach the server, confirm `WHISPER_SERVER_URL` has **no** trailing slash and matches the port (8000).

## 4. Next.js dev server

New terminal:

```bash
npm run dev
```

Open **http://localhost:3000**

## 5. One-time Cloudant data

Ensure databases **`languages`** and **`entries`** exist and seed demo languages (`mi`, `cy`, `kw`, etc.) plus Mango indexes — see **`BUILD.md`** (Database Documents / Seed section).

Without `languages`, the home page dropdown will be empty.

## Troubleshooting

| Issue | Check |
|--------|--------|
| Transcribe fails | Whisper server running; `WHISPER_SERVER_URL` matches; CORS uses `localhost:3000` |
| `cublas64_12.dll` / CUDA errors | Defaults are **CPU** (`WHISPER_DEVICE` unset). If you set `WHISPER_DEVICE=cuda`, install matching NVIDIA CUDA/cuBLAS or switch back to `WHISPER_DEVICE=cpu` and restart `whisper_server.py`. |
| watsonx / Cloudant errors | All vars in `.env.local`; IAM token/API key scopes |
| Upload / audio URLs | Cloudinary cloud name + preset settings (resource type treats audio under **video**) |
| `npm run build` fails with `.next` lock | Stop `npm run dev`, delete `.next`, build again |

## Production-ish run

```bash
npm run build
npm run start
```

Still run the Whisper process separately (same `WHISPER_SERVER_URL`), or deploy it where your app can reach it.

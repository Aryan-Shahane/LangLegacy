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

# Local Whisper HTTP API (must match whisper server below)
WHISPER_SERVER_URL=http://localhost:8000
```

Use your real values; see `BUILD.md` for fuller context on IBM / Cloudinary setup.

## 3. Whisper server (Python)

```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
python whisper_server.py
```

Leave this running. It listens on port **8000** by default. On CPU-only machines the first transcription may download the model once (slower cold start).

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
| watsonx / Cloudant errors | All vars in `.env.local`; IAM token/API key scopes |
| Upload / audio URLs | Cloudinary cloud name + preset settings (resource type treats audio under **video**) |
| `npm run build` fails with `.next` lock | Stop `npm run dev`, delete `.next`, build again |

## Production-ish run

```bash
npm run build
npm run start
```

Still run the Whisper process separately (same `WHISPER_SERVER_URL`), or deploy it where your app can reach it.

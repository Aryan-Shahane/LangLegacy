# LangLegacy

## Current Status

Cursor has already scaffolded and verified the full project. `npm run lint` and `npm run build` both pass.

**DO NOT regenerate or overwrite any of the following — they exist and work:**
- All files in `app/` (layout, pages, API routes)
- All files in `lib/` (watsonx, cloudant, cos, whisper, types)
- All files in `components/`
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `app/globals.css`

When asked to work on something, **edit the specific file only**. Do not regenerate the project structure.

---

## What Still Needs To Be Done

- [ ] **Swap Whisper API → local faster-whisper server** (see Local Whisper section below)
- [ ] **Wire up real `.env.local` credentials** and smoke test each integration
- [ ] **Seed Cloudant** with language documents
- [ ] **UI polish** — styling pass on all pages and components
- [ ] **End-to-end test** the full upload flow with a real audio file

---

## What the App Does

**LangLegacy** turns endangered language audio recordings into interactive, searchable audio dictionaries.

```
audio in → transcribe (local Whisper) → extract vocabulary (IBM watsonx) → dictionary entry with audio → community adds more
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Speech-to-Text | **faster-whisper running locally** (free, CUDA-accelerated) |
| NLP / Extraction | **IBM watsonx.ai** (`ibm/granite-13b-instruct-v2`) |
| Database | **IBM Cloudant** (NoSQL / CouchDB) |
| File Storage | **IBM Cloud Object Storage** (S3-compatible) |

---

## Environment Variables (`.env.local`)

```env
# IBM watsonx
WATSONX_API_KEY=VDsdoVrV8_73wbQoU19BjhLDFrFz7KyzzTi1WfaoWAO2
WATSONX_PROJECT_ID=9676ad1a-5085-41bc-b5d9-86dfdcac482c
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Cloudant
CLOUDANT_URL=
CLOUDANT_API_KEY=

# IBM Cloud Object Storage
COS_ENDPOINT=https://s3.us-south.cloud-object-storage.appdomain.cloud
COS_ACCESS_KEY_ID=
COS_SECRET_ACCESS_KEY=
COS_BUCKET_NAME=lang-legacy-audio

# Local Whisper server
WHISPER_SERVER_URL=http://localhost:8000
```

Note: No `OPENAI_API_KEY` needed — Whisper runs locally.

---

## Local Whisper Setup

Whisper runs as a local Python FastAPI server on port 8000. The Next.js app POSTs audio to it and gets back a transcript. This replaces the OpenAI Whisper API call entirely.

### Python server (`whisper_server.py` — lives in project root)

```python
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile, os, uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Loads on startup — "base" is fast and accurate enough for demo
# device="cuda" uses your NVIDIA GPU, compute_type="float16" is fastest on modern GPUs
model = WhisperModel("base", device="cuda", compute_type="float16")

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language_code: str = Form(default=None)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language_code if language_code else None
        )
        transcript = " ".join(segment.text for segment in segments).strip()
        return { "transcript": transcript, "language_code": language_code }
    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Install dependencies (Windows, run once)

```bash
pip install faster-whisper fastapi uvicorn python-multipart
```

### Run during development

```bash
# Terminal 1 — Python transcription server
python whisper_server.py

# Terminal 2 — Next.js app
npm run dev
```

### Update `lib/whisper.ts` to call local server instead of OpenAI

Replace the entire file with:

```typescript
export async function transcribeAudio(
  audioFile: File,
  languageCode?: string
): Promise<{ transcript: string; language_code: string }> {
  const form = new FormData()
  form.append('audio', audioFile)
  if (languageCode) form.append('language_code', languageCode)

  const res = await fetch(`${process.env.WHISPER_SERVER_URL}/transcribe`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) throw new Error(`Whisper server error: ${res.status}`)
  return res.json()
}
```

---

## File Map (all files exist — do not recreate)

```
lang-legacy/
├── whisper_server.py               # ← NEEDS TO BE CREATED (see above)
├── app/
│   ├── layout.tsx                  # ✅ exists
│   ├── page.tsx                    # ✅ exists — language selector home
│   ├── globals.css                 # ✅ exists
│   ├── [language]/
│   │   ├── page.tsx                # ✅ exists — dictionary view
│   │   └── contribute/
│   │       └── page.tsx            # ✅ exists — record new word
│   └── api/
│       ├── transcribe/route.ts     # ✅ exists — calls lib/whisper.ts
│       ├── extract/route.ts        # ✅ exists — calls lib/watsonx.ts
│       ├── entries/route.ts        # ✅ exists — reads/writes Cloudant
│       └── languages/route.ts     # ✅ exists — reads Cloudant
├── components/
│   ├── AudioPlayer.tsx             # ✅ exists
│   ├── AudioRecorder.tsx           # ✅ exists
│   ├── DictionaryEntry.tsx         # ✅ exists
│   ├── SearchBar.tsx               # ✅ exists
│   ├── LanguageCard.tsx            # ✅ exists
│   └── UploadFlow.tsx              # ✅ exists
├── lib/
│   ├── watsonx.ts                  # ✅ exists — update if needed
│   ├── cloudant.ts                 # ✅ exists
│   ├── cos.ts                      # ✅ exists
│   ├── whisper.ts                  # ✅ exists — NEEDS REPLACING (see above)
│   └── types.ts                    # ✅ exists
├── .env.local                      # ← fill in credentials
├── .env.local.example              # ✅ exists
└── CLAUDE.md                       # this file
```

---

## Key Integrations (already implemented — reference only)

### IBM watsonx (`lib/watsonx.ts`)
- Exchanges `WATSONX_API_KEY` for a short-lived IAM bearer token (cached, refreshed before expiry)
- Calls `/ml/v1/text/generation` with model `ibm/granite-13b-instruct-v2`
- Used by `POST /api/extract` to pull vocabulary entries from a transcript

### IBM Cloudant (`lib/cloudant.ts`)
- Three functions: `findDocuments`, `getAllDocuments`, `saveDocument`
- Uses Mango `_find` for filtered queries, `_all_docs` for full listings
- Two databases: `languages` and `entries`

### IBM Cloud Object Storage (`lib/cos.ts`)
- Uses `@aws-sdk/client-s3` (IBM COS is S3-compatible with `forcePathStyle: true`)
- `uploadAudio(key, buffer, contentType)` → returns public URL

---

## Database Documents

### `languages` DB
```json
{
  "_id": "mi",
  "type": "language",
  "name": "Māori",
  "code": "mi",
  "region": "New Zealand",
  "speaker_count": 50000,
  "entry_count": 0,
  "created_at": "2026-05-08T00:00:00Z"
}
```

### `entries` DB
```json
{
  "_id": "uuid",
  "type": "entry",
  "language_code": "mi",
  "word": "kia ora",
  "phonetic": "kia ɔɾa",
  "translation": "hello / thank you / be well",
  "part_of_speech": "greeting",
  "example_sentence": "Kia ora koutou katoa",
  "example_translation": "Hello everyone",
  "audio_url": "https://s3.us-south.cloud-object-storage.appdomain.cloud/lang-legacy-audio/entries/uuid.webm",
  "source": "archive",
  "created_at": "2026-05-08T00:00:00Z"
}
```

### Cloudant Mango indexes (create in dashboard)
```json
{ "index": { "fields": ["language_code", "type"] }, "name": "language-entries-index", "type": "json" }
{ "index": { "fields": ["word", "translation"] }, "name": "word-search-index", "type": "text" }
```

### Seed languages (POST to Cloudant `languages` DB)
```json
[
  { "_id": "mi", "type": "language", "name": "Māori", "code": "mi", "region": "New Zealand", "speaker_count": 50000, "entry_count": 0, "created_at": "2026-05-08T00:00:00Z" },
  { "_id": "cy", "type": "language", "name": "Welsh", "code": "cy", "region": "Wales", "speaker_count": 600000, "entry_count": 0, "created_at": "2026-05-08T00:00:00Z" },
  { "_id": "kw", "type": "language", "name": "Cornish", "code": "kw", "region": "Cornwall", "speaker_count": 3000, "entry_count": 0, "created_at": "2026-05-08T00:00:00Z" }
]
```

---

## Prompting Rules for Cursor

- **Always reference the file map above** before touching any file
- **Never scaffold or recreate** files marked ✅ — edit only
- **One file at a time** — specify the exact file path in every prompt
- **After any edit**, run `npm run build` to confirm nothing broke

### Good prompt patterns

```
"Edit only lib/whisper.ts — replace its contents with the local server version from CLAUDE.md"

"Edit only app/[language]/page.tsx — add a loading skeleton while entries are fetching. Do not touch any other file."

"Edit only components/DictionaryEntry.tsx — improve the styling. Keep all props and logic identical."

"Create whisper_server.py in the project root using the spec in CLAUDE.md. Do not touch any other file."
```

---

## What to Ignore

- User auth
- Pagination UI (client-side filtering is fine at demo scale)
- Real-time waveform (CSS bar animation is enough)
- Error boundary polish (happy path only for demo)
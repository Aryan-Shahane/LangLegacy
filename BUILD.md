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
- [ ] **Replace IBM COS → Cloudinary** in `lib/cos.ts` (see Cloudinary section below)
- [ ] **Wire up real `.env.local` credentials** and smoke test each integration
- [ ] **Seed Cloudant** with language documents
- [ ] **UI polish** — styling pass on all pages and components
- [ ] **End-to-end test** the full upload flow with a real audio file
- [ ] **Build Community tab** — post feed with language-tagged posts and reactions
- [ ] **Build Chatrooms tab** — per-language real-time chat rooms
- [ ] **Build Learning tab** — flashcard sessions, quizzes, and progress tracking
- [ ] **Add Report flow** — flag button on every dictionary entry + community post
- [ ] **Build Moderator dashboard** — review queue for reports, approve/remove decisions
- [ ] **Add user roles** — `user`, `moderator`, `admin` stored in Cloudant `users` DB
- [ ] **Implement tab nav** — Dictionary | Community | Chatrooms | Learning tabs on language pages

---

## What the App Does

**LangLegacy** turns endangered language audio recordings into interactive, searchable audio dictionaries — with a community layer for discussion, learning, and collective curation.

```
audio in → transcribe (local Whisper) → extract vocabulary (IBM watsonx) → dictionary entry with audio → community adds more
                                                                                         ↓
                                                   community posts · chatrooms · learning flashcards · moderated reports
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
| File Storage | **Cloudinary** (free tier, no credit card) |
| Real-time Chat | **Server-Sent Events (SSE)** via Next.js API route (no external service) |

---

## Environment Variables (`.env.local`)

```env
# IBM watsonx
WATSONX_API_KEY=VDsdoVrV8_73wbQoU19BjhLDFrFz7KyzzTi1WfaoWAO2
WATSONX_PROJECT_ID=9676ad1a-5085-41bc-b5d9-86dfdcac482c
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Cloudant
CLOUDANT_URL=https://1ef189cc-7df4-4958-bae4-ccc3ff5dfcc8-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_API_KEY=AdzlOkYBiey-Ng71rXoUDmoq5P04RxQWYAjp9ZcGDKff

# Cloudinary (audio file storage)
CLOUDINARY_CLOUD_NAME=djeo1nkko
CLOUDINARY_UPLOAD_PRESET=langlegacy

# Local Whisper server
WHISPER_SERVER_URL=http://localhost:8000

# Auth (simple JWT secret — generate with: openssl rand -base64 32)
AUTH_SECRET=replace_with_your_secret
```

---

## Tab Navigation Architecture

Each language page (`app/[language]/page.tsx`) renders four top-level tabs. The active tab is tracked in URL search params (`?tab=dictionary` etc.) so links are shareable.

| Tab | URL param | Route / Component |
|---|---|---|
| Dictionary | `?tab=dictionary` | Existing dictionary view |
| Community | `?tab=community` | Post feed for this language |
| Chatrooms | `?tab=chatrooms` | List of chat rooms → individual room |
| Learning | `?tab=learning` | Flashcard / quiz interface |

Tab state lives in `app/[language]/page.tsx` via `useSearchParams`. No new top-level routes needed — all tabs render inside the existing language page layout.

```tsx
// app/[language]/page.tsx — tab switching pattern
const tabs = ['dictionary', 'community', 'chatrooms', 'learning'] as const
const activeTab = searchParams.get('tab') ?? 'dictionary'
```

---

## Community Tab

### What it is
A language-scoped post feed. Users write text posts (optionally attaching an audio clip) to share knowledge, ask questions, or celebrate milestones. Posts can receive emoji reactions.

### Cloudant document — `posts` DB

```json
{
  "_id": "uuid",
  "type": "post",
  "language_code": "mi",
  "author_id": "user_uuid",
  "author_name": "Te Ao",
  "body": "Anyone know the traditional word for 'rainbow'? I've heard two variants.",
  "audio_url": null,
  "reactions": { "❤️": 4, "🙌": 2 },
  "report_count": 0,
  "status": "active",
  "created_at": "2026-05-08T00:00:00Z"
}
```

`status` values: `"active"` | `"removed"` | `"under_review"`

### API routes to create

| Method | Route | Action |
|---|---|---|
| GET | `/api/posts?language_code=mi` | List active posts for a language |
| POST | `/api/posts` | Create a new post |
| POST | `/api/posts/[id]/react` | Toggle an emoji reaction |
| POST | `/api/posts/[id]/report` | File a report against a post |

### Components to create

- `components/PostCard.tsx` — renders a single post with reactions and a report button
- `components/PostComposer.tsx` — text area + optional audio recorder + submit
- `components/ReactionBar.tsx` — emoji pill buttons with counts

### Report button on posts
Every `PostCard` has a flag icon (⚑) in the top-right corner. Clicking it opens a small inline dropdown:

```
Why are you reporting this?
○ Inaccurate / misleading
○ Offensive or harmful
○ Spam
○ Other
[ Submit report ]
```

Submitting POSTs to `/api/posts/[id]/report` and creates a `report` document (see Moderation section).

---

## Chatrooms Tab

### What it is
Per-language text chat rooms. Each language has a **General** room by default. Moderators can create additional themed rooms (e.g. "Pronunciation Help", "Grammar Questions"). Messages are stored in Cloudant and streamed to connected clients via SSE.

### Cloudant documents

**`rooms` DB**
```json
{
  "_id": "uuid",
  "type": "room",
  "language_code": "mi",
  "name": "General",
  "description": "Open discussion about Māori language",
  "created_by": "moderator_uuid",
  "created_at": "2026-05-08T00:00:00Z"
}
```

**`messages` DB**
```json
{
  "_id": "uuid",
  "type": "message",
  "room_id": "room_uuid",
  "language_code": "mi",
  "author_id": "user_uuid",
  "author_name": "Te Ao",
  "body": "Kia ora! Anyone practicing pronunciation today?",
  "report_count": 0,
  "status": "active",
  "created_at": "2026-05-08T12:34:56Z"
}
```

### API routes to create

| Method | Route | Action |
|---|---|---|
| GET | `/api/rooms?language_code=mi` | List rooms for a language |
| POST | `/api/rooms` | Create a room (moderator only) |
| GET | `/api/rooms/[id]/messages` | Fetch last 50 messages |
| POST | `/api/rooms/[id]/messages` | Post a new message |
| GET | `/api/rooms/[id]/stream` | SSE endpoint — pushes new messages as `data:` events |
| POST | `/api/messages/[id]/report` | Report a message |

### SSE streaming pattern

```typescript
// app/api/rooms/[id]/stream/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Poll Cloudant every 2s for messages newer than the last seen _id
      // In production replace with Cloudant _changes feed
      const interval = setInterval(async () => {
        const newMessages = await getMessagesSince(params.id, lastSeenId)
        if (newMessages.length) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(newMessages)}\n\n`))
          lastSeenId = newMessages.at(-1)!._id
        }
      }, 2000)
      req.signal.addEventListener('abort', () => clearInterval(interval))
    }
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
  })
}
```

### Components to create

- `components/RoomList.tsx` — grid of room cards for a language
- `components/ChatRoom.tsx` — message list + input bar, subscribes to SSE stream
- `components/MessageBubble.tsx` — individual chat message with report button

---

## Learning Tab

### What it is
Spaced-repetition-style flashcard sessions using the dictionary entries for a language. A user sees a word, guesses the translation, then flips the card. Progress is saved per-user per-language.

### Session flow

```
1. Pull N random entries for the language from Cloudant
2. Show word (+ audio playback button) — hide translation
3. User clicks "Show Answer"
4. User self-rates: ✗ Missed  /  ~ Almost  /  ✓ Got it
5. Rating updates local session score; "Missed" cards are re-queued
6. After all cards: show summary (score, streak, time)
7. POST session result to /api/learning/sessions
```

### Cloudant documents

**`learning_sessions` DB**
```json
{
  "_id": "uuid",
  "type": "learning_session",
  "user_id": "user_uuid",
  "language_code": "mi",
  "cards_seen": 10,
  "cards_correct": 7,
  "duration_seconds": 142,
  "created_at": "2026-05-08T00:00:00Z"
}
```

**`learning_progress` DB** (one doc per user per language, upserted after each session)
```json
{
  "_id": "user_uuid:mi",
  "type": "learning_progress",
  "user_id": "user_uuid",
  "language_code": "mi",
  "total_sessions": 5,
  "total_correct": 34,
  "total_seen": 48,
  "streak_days": 3,
  "last_session_at": "2026-05-08T00:00:00Z"
}
```

### API routes to create

| Method | Route | Action |
|---|---|---|
| GET | `/api/learning/cards?language_code=mi&n=10` | Random sample of N entries |
| POST | `/api/learning/sessions` | Save a completed session |
| GET | `/api/learning/progress?language_code=mi` | User's progress for a language |

### Components to create

- `components/FlashCard.tsx` — flip animation, audio button, self-rating buttons
- `components/SessionSummary.tsx` — end-of-session results screen
- `components/ProgressBar.tsx` — streak and accuracy display at top of Learning tab

### Quiz mode (stretch goal, same tab)
After flashcards, offer a multiple-choice quiz: show a word, present 4 translation options (1 correct + 3 random from the same language). No new API routes needed — pulls from the same `/api/learning/cards` endpoint.

---

## Reporting System

### How it works

1. Every dictionary entry, community post, and chat message has a **report button** (⚑ flag icon).
2. Clicking opens a reason picker (Inaccurate / Offensive / Spam / Other).
3. Submitting creates a `report` document in the `reports` DB and increments `report_count` on the target document.
4. Moderators see all open reports in their dashboard at `/mod`.
5. Moderator clicks **Remove** (sets target `status: "removed"`, closes report) or **Keep** (dismisses report, closes it).

### Cloudant document — `reports` DB

```json
{
  "_id": "uuid",
  "type": "report",
  "target_type": "entry" | "post" | "message",
  "target_id": "target_document_uuid",
  "language_code": "mi",
  "reporter_id": "user_uuid",
  "reason": "inaccurate" | "offensive" | "spam" | "other",
  "details": "Optional free-text from reporter",
  "status": "open" | "resolved_removed" | "resolved_kept",
  "resolved_by": null,
  "resolved_at": null,
  "created_at": "2026-05-08T00:00:00Z"
}
```

### API routes to create

| Method | Route | Action |
|---|---|---|
| POST | `/api/entries/[id]/report` | Report a dictionary entry |
| POST | `/api/posts/[id]/report` | Report a community post |
| POST | `/api/messages/[id]/report` | Report a chat message |
| GET | `/api/mod/reports` | List open reports (moderator only) |
| POST | `/api/mod/reports/[id]/resolve` | Resolve a report with action |

### `POST /api/mod/reports/[id]/resolve` body

```json
{
  "action": "remove" | "keep",
  "moderator_id": "mod_uuid"
}
```

`"remove"` → sets `report.status = "resolved_removed"` AND sets `target.status = "removed"`.  
`"keep"` → sets `report.status = "resolved_kept"`. Target document unchanged.

---

## Moderator Dashboard (`app/mod/`)

### Access control
A middleware check (`middleware.ts`) reads the user's role from their session. Only users with `role: "moderator"` or `role: "admin"` can access `/mod/*`. Others get a 403 page.

### Pages

```
app/mod/
├── page.tsx          # Overview: open report count, recent activity
└── reports/
    └── page.tsx      # Report queue — list of all open reports with resolve actions
```

### Report queue UI (`app/mod/reports/page.tsx`)

Each row in the queue shows:
- **Target type** badge (Entry / Post / Message)
- **Language** badge
- **Report reason**
- **Preview** of the flagged content (word + translation for entries, first 100 chars for posts/messages)
- **Reporter count** (how many users reported this same item)
- **Remove** button (red) — removes content and resolves all linked reports
- **Keep** button (grey) — dismisses without removal

Rows are sorted by report count descending (most-reported first).

### Components to create

- `components/ReportRow.tsx` — single report item with resolve buttons
- `components/ModStats.tsx` — overview counts (open reports, resolved today, etc.)

---

## User Roles & Auth

### Roles

| Role | Capabilities |
|---|---|
| `user` | Post, chat, learn, report content |
| `moderator` | All user caps + access `/mod` dashboard, create chat rooms, resolve reports |
| `admin` | All moderator caps + promote/demote users |

### Cloudant document — `users` DB

```json
{
  "_id": "user_uuid",
  "type": "user",
  "name": "Te Ao",
  "email": "teao@example.com",
  "role": "user",
  "created_at": "2026-05-08T00:00:00Z"
}
```

### Auth approach (keep it simple for demo)
Use a lightweight cookie-based session with a signed JWT (via `jose` npm package). No OAuth needed for demo. Users pick a display name on first visit; it's stored in a cookie. Role is looked up from Cloudant on each mod-route request.

```bash
npm install jose
```

### Middleware (`middleware.ts` in project root)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/mod')) {
    const token = req.cookies.get('session')?.value
    if (!token) return NextResponse.redirect(new URL('/', req.url))
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET))
      if (payload.role !== 'moderator' && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/mod/:path*'] }
```

---

## Cloudinary Integration (`lib/cos.ts`)

IBM COS has been replaced with Cloudinary. Replace the entire `lib/cos.ts` file with:

```typescript
export async function uploadAudio(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET!

  const blob = new Blob([buffer], { type: contentType })
  const form = new FormData()
  form.append('file', blob, key)
  form.append('upload_preset', uploadPreset)
  form.append('public_id', key.replace(/\//g, '_'))
  form.append('resource_type', 'video') // Cloudinary uses 'video' for audio files

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: 'POST', body: form }
  )

  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`)
  const data = await res.json()
  return data.secure_url
}
```

Note: `resource_type: 'video'` is correct — Cloudinary handles audio under the video resource type.

---

## Local Whisper Setup

Whisper runs as a local Python FastAPI server on port 8000. The Next.js app POSTs audio to it and gets back a transcript.

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

# device="cuda" uses NVIDIA GPU, compute_type="float16" is fastest
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

### `lib/whisper.ts` — replace entire file with

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

## File Map (all files exist — do not recreate unless marked ← NEEDS CREATING)

```
lang-legacy/
├── whisper_server.py                     # ← NEEDS CREATING (see above)
├── middleware.ts                         # ← NEEDS CREATING (see User Roles section)
├── app/
│   ├── layout.tsx                        # ✅ exists
│   ├── page.tsx                          # ✅ exists — language selector home
│   ├── globals.css                       # ✅ exists
│   ├── [language]/
│   │   ├── page.tsx                      # ✅ exists — ADD tab nav + render tab views
│   │   └── contribute/
│   │       └── page.tsx                  # ✅ exists — record new word
│   ├── mod/
│   │   ├── page.tsx                      # ← NEEDS CREATING — mod overview
│   │   └── reports/
│   │       └── page.tsx                  # ← NEEDS CREATING — report queue
│   └── api/
│       ├── transcribe/route.ts           # ✅ exists
│       ├── extract/route.ts              # ✅ exists
│       ├── entries/route.ts              # ✅ exists
│       ├── entries/[id]/report/route.ts  # ← NEEDS CREATING
│       ├── languages/route.ts            # ✅ exists
│       ├── posts/route.ts                # ← NEEDS CREATING
│       ├── posts/[id]/react/route.ts     # ← NEEDS CREATING
│       ├── posts/[id]/report/route.ts    # ← NEEDS CREATING
│       ├── rooms/route.ts                # ← NEEDS CREATING
│       ├── rooms/[id]/messages/route.ts  # ← NEEDS CREATING
│       ├── rooms/[id]/stream/route.ts    # ← NEEDS CREATING (SSE)
│       ├── messages/[id]/report/route.ts # ← NEEDS CREATING
│       ├── learning/cards/route.ts       # ← NEEDS CREATING
│       ├── learning/sessions/route.ts    # ← NEEDS CREATING
│       ├── learning/progress/route.ts    # ← NEEDS CREATING
│       └── mod/
│           └── reports/route.ts          # ← NEEDS CREATING
│           └── reports/[id]/resolve/route.ts # ← NEEDS CREATING
├── components/
│   ├── AudioPlayer.tsx                   # ✅ exists
│   ├── AudioRecorder.tsx                 # ✅ exists
│   ├── DictionaryEntry.tsx               # ✅ exists — ADD report button
│   ├── SearchBar.tsx                     # ✅ exists
│   ├── LanguageCard.tsx                  # ✅ exists
│   ├── UploadFlow.tsx                    # ✅ exists
│   ├── TabNav.tsx                        # ← NEEDS CREATING
│   ├── PostCard.tsx                      # ← NEEDS CREATING
│   ├── PostComposer.tsx                  # ← NEEDS CREATING
│   ├── ReactionBar.tsx                   # ← NEEDS CREATING
│   ├── RoomList.tsx                      # ← NEEDS CREATING
│   ├── ChatRoom.tsx                      # ← NEEDS CREATING
│   ├── MessageBubble.tsx                 # ← NEEDS CREATING
│   ├── FlashCard.tsx                     # ← NEEDS CREATING
│   ├── SessionSummary.tsx                # ← NEEDS CREATING
│   ├── ProgressBar.tsx                   # ← NEEDS CREATING
│   ├── ReportModal.tsx                   # ← NEEDS CREATING (shared report reason picker)
│   ├── ReportRow.tsx                     # ← NEEDS CREATING (mod dashboard)
│   └── ModStats.tsx                      # ← NEEDS CREATING (mod dashboard)
├── lib/
│   ├── watsonx.ts                        # ✅ exists
│   ├── cloudant.ts                       # ✅ exists
│   ├── cos.ts                            # ✅ exists — NEEDS REPLACING (Cloudinary)
│   ├── whisper.ts                        # ✅ exists — NEEDS REPLACING (local server)
│   └── types.ts                          # ✅ exists — ADD new types (Post, Room, Message, Report, etc.)
├── .env.local                            # ← fill in credentials
├── .env.local.example                    # ✅ exists
└── CLAUDE.md                             # this file
```

---

## Cloudant Databases — Full List

| DB name | Contents |
|---|---|
| `languages` | Language metadata documents |
| `entries` | Dictionary entry documents |
| `posts` | Community post documents |
| `rooms` | Chat room documents |
| `messages` | Chat message documents |
| `reports` | Report documents |
| `users` | User profile + role documents |
| `learning_sessions` | Completed flashcard session records |
| `learning_progress` | Per-user per-language progress (upserted) |

---

## Cloudant Mango Indexes (create in dashboard)

```json
{ "index": { "fields": ["language_code", "type"] }, "name": "language-entries-index", "type": "json" }
{ "index": { "fields": ["word", "translation"] }, "name": "word-search-index", "type": "text" }
{ "index": { "fields": ["language_code", "type", "status"] }, "name": "language-posts-index", "type": "json" }
{ "index": { "fields": ["room_id", "type", "created_at"] }, "name": "room-messages-index", "type": "json" }
{ "index": { "fields": ["status", "type"] }, "name": "reports-open-index", "type": "json" }
{ "index": { "fields": ["user_id", "language_code", "type"] }, "name": "user-progress-index", "type": "json" }
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
- **Extend** `saveDocument` to accept a `db` parameter so it works across all new databases

### Cloudinary (`lib/cos.ts`)
- `uploadAudio(key, buffer, contentType)` → returns Cloudinary `secure_url`
- Cloud name: `djeo1nkko`, upload preset: `langlegacy`
- Uses unsigned upload preset — no API secret needed

---

## Seed Data

### `languages` DB (unchanged)
```json
[
  { "_id": "mi", "type": "language", "name": "Māori", "code": "mi", "region": "New Zealand", "speaker_count": 50000, "entry_count": 0, "created_at": "2026-05-08T00:00:00Z" },
  { "_id": "cy", "type": "language", "name": "Welsh", "code": "cy", "region": "Wales", "speaker_count": 600000, "entry_count": 0, "created_at": "2026-05-08T00:00:00Z" },
  { "_id": "kw", "type": "language", "name": "Cornish", "code": "kw", "region": "Cornwall", "speaker_count": 3000, "entry_count": 0, "created_at": "2026-05-08T00:00:00Z" }
]
```

### `rooms` DB — seed one General room per language
```json
[
  { "_id": "room-mi-general", "type": "room", "language_code": "mi", "name": "General", "description": "Open discussion about Māori language", "created_by": "system", "created_at": "2026-05-08T00:00:00Z" },
  { "_id": "room-cy-general", "type": "room", "language_code": "cy", "name": "General", "description": "Open discussion about Welsh language", "created_by": "system", "created_at": "2026-05-08T00:00:00Z" },
  { "_id": "room-kw-general", "type": "room", "language_code": "kw", "name": "General", "description": "Open discussion about Cornish language", "created_by": "system", "created_at": "2026-05-08T00:00:00Z" }
]
```

### `users` DB — seed one moderator account
```json
[
  { "_id": "mod-001", "type": "user", "name": "Admin", "email": "admin@langlegacy.dev", "role": "admin", "created_at": "2026-05-08T00:00:00Z" }
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
"Edit only lib/cos.ts — replace its contents with the Cloudinary version from CLAUDE.md. Do not touch any other file."

"Edit only lib/whisper.ts — replace its contents with the local server version from CLAUDE.md. Do not touch any other file."

"Create whisper_server.py in the project root using the spec in CLAUDE.md. Do not touch any other file."

"Create middleware.ts in the project root using the spec in CLAUDE.md. Do not touch any other file."

"Create app/api/posts/route.ts — GET lists active posts by language_code, POST creates a new post. Use lib/cloudant.ts. Do not touch any other file."

"Create components/TabNav.tsx — four tabs: Dictionary, Community, Chatrooms, Learning. Active tab from URL search param. Do not touch any other file."

"Create components/FlashCard.tsx — flip animation, audio button, three self-rating buttons (Missed / Almost / Got it). Do not touch any other file."

"Create app/mod/reports/page.tsx — moderator report queue. Fetches /api/mod/reports, renders ReportRow components. Do not touch any other file."

"Edit only components/DictionaryEntry.tsx — add a report button (flag icon) that opens ReportModal. Keep all existing props and logic identical."

"Edit only app/[language]/page.tsx — add tab nav using TabNav component, conditionally render community/chatroom/learning views based on ?tab param. Do not touch any other file."
```

---

## What to Ignore

- User auth beyond simple JWT cookies (no OAuth, no email verification)
- Pagination UI (client-side filtering is fine at demo scale)
- Real-time waveform (CSS bar animation is enough)
- Error boundary polish (happy path only for demo)
- Push notifications for new chat messages
- Rate limiting on report submissions
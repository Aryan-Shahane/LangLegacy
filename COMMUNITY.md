# CLAUDE.md — LangLegacy

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

- [ ] **Swap Whisper API → local faster-whisper server** (see Local Whisper section)
- [ ] **Replace IBM COS → Cloudinary** in `lib/cos.ts` (see Cloudinary section)
- [ ] **Wire up real `.env.local` credentials** and smoke test each integration
- [ ] **Seed Cloudant** with language documents
- [ ] **Build all four tabs** inside `app/[language]/page.tsx` (see Tabs section)
- [ ] **Build Community Hub** — Forum, Poetry, Storytelling sub-sections
- [ ] **Build Learn tab** — flashcard mode
- [ ] **Build Report system** — user reports + moderator dashboard
- [ ] **UI polish** — styling pass on all pages and components
- [ ] **End-to-end test** the full upload flow with a real audio file

---

## What the App Does

**LangLegacy** turns endangered language audio recordings into interactive, searchable audio dictionaries — with a community hub for speakers and learners to connect, share, and preserve their culture together.

```
audio in → transcribe (local Whisper) → extract vocabulary (IBM watsonx) → dictionary entry with audio → community engages
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

---

## Environment Variables (`.env.local`)

```env
# IBM watsonx
WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Cloudant
CLOUDANT_URL=
CLOUDANT_API_KEY=

# Cloudinary (audio file storage)
CLOUDINARY_CLOUD_NAME=djeo1nkko
CLOUDINARY_UPLOAD_PRESET=langlegacy

# Local Whisper server
WHISPER_SERVER_URL=http://localhost:8000
```

---

## App Navigation Structure

Each language page (`app/[language]/page.tsx`) has four top-level tabs rendered as a tab bar:

```
[ Dictionary ]  [ Learn ]  [ Community ]  [ Moderator ]
```

- **Dictionary** — searchable word entries (already built)
- **Learn** — flashcard mode built from dictionary entries
- **Community** — hub with three sub-sections: Forum, Poetry, Storytelling
- **Moderator** — report queue (only visible if `isModerator === true` in session/cookie)

Tab state lives in the URL: `?tab=dictionary` `?tab=learn` `?tab=community` `?tab=moderator`

Community sub-section state also lives in URL: `?tab=community&section=forum` etc.

---

## Tab 1 — Dictionary (already built)

Exists. Do not recreate. Searchable entries pulled from Cloudant `entries` DB.

Added feature: **Report button** on every `DictionaryEntry.tsx` card.
- Small flag icon in the top-right corner of each card
- Opens a modal: dropdown reason (Inaccurate translation / Offensive content / Incorrect audio / Other) + optional text field
- Submits to `POST /api/reports`
- Shows confirmation: "Thank you — a moderator will review this"

---

## Tab 2 — Learn

**Route:** `?tab=learn`

Flashcard mode that drills vocabulary from the dictionary.

### How it works
1. Pull all entries for the language from `/api/entries?language_code=...`
2. Shuffle the deck
3. Show the English translation → user thinks of the word
4. User flips the card → sees the endangered language word + phonetic + plays audio automatically
5. User marks: ✅ Got it / ❌ Missed it
6. Missed cards re-enter the deck
7. Session ends when all cards are marked ✅
8. Show a summary: X/Y words learned, time taken

### State
All state is local (no backend needed). Use `useState` + `useReducer`.

### New files
```
app/[language]/learn/                # if broken into own page — otherwise inline in tab
components/FlashCard.tsx             # single card with flip animation
components/LearnSession.tsx          # manages deck state, progress bar, summary screen
```

### FlashCard.tsx spec
Props: `{ entry: Entry, onGot: () => void, onMissed: () => void }`
- Front: English translation (large text, centered)
- Back: Word in endangered language (large) + phonetic (muted) + AudioPlayer auto-plays on flip
- CSS flip animation (rotateY transform)
- Two buttons on back: "Got it ✅" and "Missed it ❌"

---

## Tab 3 — Community Hub

**Route:** `?tab=community&section=forum|poetry|storytelling`

The Community tab is a hub with three sub-sections. Render a secondary nav inside the tab:

```
[ Forum ]  [ Poetry ]  [ Storytelling ]
```

---

### Community Sub-section 1 — Forum

A threaded discussion board for speakers and learners.

#### Post data model (Cloudant `posts` DB)

```json
{
  "_id": "uuid",
  "type": "post",
  "section": "forum",
  "language_code": "mi",
  "author_name": "Alice Runningwater",
  "author_id": "anon_uuid",
  "body": "Does anyone know the word for thunder in Western dialect?",
  "parent_id": null,
  "root_id": null,
  "depth": 0,
  "reactions": { "❤️": ["anon_1", "anon_2"], "💡": ["anon_3"] },
  "created_at": "2026-05-08T10:00:00Z"
}
```

#### Threading rules
- `depth 0` = top-level post
- `depth 1` = reply to a post
- `depth 2` = reply to a reply (maximum — after this, replies are appended flat at depth 2)
- `root_id` always points to the original depth-0 post
- `parent_id` points to the immediate parent

#### API routes
```
GET  /api/posts?language_code=mi&section=forum     → list top-level posts
POST /api/posts                                     → create post
POST /api/posts/[id]/reply                          → reply to any post
POST /api/posts/[id]/react                          → toggle emoji reaction
DELETE /api/posts/[id]                              → author or moderator only
```

#### Components
```
components/forum/PostCard.tsx         # post body, author, timestamp, ReactionBar, reply button
components/forum/PostComposer.tsx     # text area + submit, hidden parentId/rootId/depth fields
components/forum/ReactionBar.tsx      # emoji counts, click to toggle ❤️ 🙏 💡 🔊 🎉 ✅
components/forum/ReplyThread.tsx      # groups replies under root, max 2 indent levels, collapse >3
```

#### Mock seed data (`lib/mock/forumMockData.ts`)
```ts
export const FORUM_MOCK_POSTS = [
  {
    _id: "post_001", type: "post", section: "forum", language_code: "mi",
    author_name: "Alice Runningwater", author_id: "anon_alice",
    body: "Just recorded my grandmother saying 'yá'át'ééh' — her pronunciation is so different from what I learned in class!",
    parent_id: null, root_id: null, depth: 0,
    reactions: { "❤️": ["anon_bob", "anon_carol"], "🙏": ["anon_dave"] },
    created_at: "2026-05-08T10:22:00Z"
  },
  {
    _id: "post_002", type: "post", section: "forum", language_code: "mi",
    author_name: "Bob Tsosie", author_id: "anon_bob",
    body: "Dialectal variation! Which region is she from? The Western dialect softens that initial glottal stop.",
    parent_id: "post_001", root_id: "post_001", depth: 1,
    reactions: { "💡": ["anon_alice"] },
    created_at: "2026-05-08T10:45:00Z"
  },
  {
    _id: "post_003", type: "post", section: "forum", language_code: "mi",
    author_name: "Alice Runningwater", author_id: "anon_alice",
    body: "She's from Chinle — is that Western?",
    parent_id: "post_002", root_id: "post_001", depth: 2,
    reactions: {},
    created_at: "2026-05-08T11:00:00Z"
  },
  {
    _id: "post_004", type: "post", section: "forum", language_code: "mi",
    author_name: "Carol Begay", author_id: "anon_carol",
    body: "Does anyone have a recording of the word for 'thunder'? I want to compare it to what's in the dictionary.",
    parent_id: null, root_id: null, depth: 0,
    reactions: { "🔊": ["anon_alice", "anon_dave", "anon_eve"] },
    created_at: "2026-05-07T18:30:00Z"
  }
]
```

---

### Community Sub-section 2 — Poetry

A gallery where users submit poems written in the endangered language, optionally with an audio recording of themselves reading it.

#### Poetry data model (Cloudant `poetry` DB)

```json
{
  "_id": "uuid",
  "type": "poem",
  "language_code": "mi",
  "title": "Ko tōku reo",
  "author_name": "Eva Ngata",
  "body_original": "Ko tōku reo\nKo tōku ohooho\nKo tōku māpihi maurea...",
  "body_translation": "My language\nIs my awakening\nIs the jewel of my heart...",
  "audio_url": "https://res.cloudinary.com/djeo1nkko/video/upload/poetry_uuid.webm",
  "reactions": { "❤️": ["anon_1"], "🌿": ["anon_2", "anon_3"] },
  "created_at": "2026-05-08T00:00:00Z"
}
```

#### API routes
```
GET  /api/poetry?language_code=mi     → list poems
POST /api/poetry                      → submit a poem
POST /api/poetry/[id]/react           → toggle reaction
DELETE /api/poetry/[id]               → author or moderator only
```

#### Components
```
components/poetry/PoemCard.tsx        # displays title, original text, translation toggle, audio player, reactions
components/poetry/PoemComposer.tsx    # form: title, original text area, translation text area, optional audio record
components/poetry/PoetryGallery.tsx   # masonry or grid layout of PoemCards
```

#### PoemCard.tsx spec
Props: `{ poem: Poem }`
- Title (bold, large)
- Author + date
- Original language text (styled distinctly — serif font, indented)
- Toggle button: "Show translation" / "Hide translation"
- AudioPlayer if `audio_url` exists
- ReactionBar — emoji set: ❤️ 🌿 ✨ 🙏

#### Mock seed data (`lib/mock/poetryMockData.ts`)
```ts
export const POETRY_MOCK = [
  {
    _id: "poem_001", type: "poem", language_code: "mi",
    title: "Ko tōku reo", author_name: "Eva Ngata",
    body_original: "Ko tōku reo\nKo tōku ohooho\nKo tōku māpihi maurea",
    body_translation: "My language\nIs my awakening\nIs the jewel of my heart",
    audio_url: null,
    reactions: { "❤️": ["anon_1", "anon_2"], "🌿": ["anon_3"] },
    created_at: "2026-05-06T14:00:00Z"
  },
  {
    _id: "poem_002", type: "poem", language_code: "mi",
    title: "Te Wao Nui", author_name: "James Parata",
    body_original: "Te wao nui a Tāne\nKo ngā rākau e tū ana\nHe taonga mō āpōpō",
    body_translation: "The great forest of Tāne\nThe trees that stand\nA treasure for tomorrow",
    audio_url: null,
    reactions: { "✨": ["anon_alice", "anon_bob"] },
    created_at: "2026-05-05T09:30:00Z"
  }
]
```

---

### Community Sub-section 3 — Storytelling

A library of oral traditions and stories recorded by community members. Stories are longer-form audio with a full transcript displayed alongside, scrollable and synced to playback.

#### Story data model (Cloudant `stories` DB)

```json
{
  "_id": "uuid",
  "type": "story",
  "language_code": "mi",
  "title": "How Māui fished up the North Island",
  "author_name": "Hemi Walker",
  "description": "A traditional account of Māui-tikitiki-a-Taranga, told by my grandfather.",
  "audio_url": "https://res.cloudinary.com/djeo1nkko/video/upload/stories_uuid.webm",
  "transcript": "I te tīmatanga, ko Māui anake i noho ki raro o te waka...",
  "transcript_translation": "In the beginning, Māui alone sat at the bottom of the canoe...",
  "duration_seconds": 342,
  "tags": ["creation", "ancestors", "ocean"],
  "reactions": { "❤️": ["anon_1"], "🙏": ["anon_2"] },
  "created_at": "2026-05-08T00:00:00Z"
}
```

#### How stories get transcribed
The story upload flow mirrors the dictionary upload flow:
1. User records or uploads audio
2. App sends to local Whisper → gets raw transcript
3. User reviews/edits transcript in a text area
4. User optionally adds translation
5. Saves to Cloudant `stories` DB + Cloudinary

#### API routes
```
GET  /api/stories?language_code=mi    → list stories
POST /api/stories                     → submit a story (with audio upload)
POST /api/stories/[id]/react          → toggle reaction
DELETE /api/stories/[id]              → author or moderator only
```

#### Components
```
components/storytelling/StoryCard.tsx        # title, author, description, duration, tags, reactions
components/storytelling/StoryPlayer.tsx      # full audio player + scrollable transcript panel side by side
components/storytelling/StoryComposer.tsx    # record/upload audio → Whisper transcript → review → save
components/storytelling/StoryLibrary.tsx     # list of StoryCards
```

#### StoryCard.tsx spec
Props: `{ story: Story, onOpen: () => void }`
- Title + author + date
- Short description (2 lines, truncated)
- Duration badge (e.g. "5:42")
- Tags as small pills
- ReactionBar
- "Listen" button → opens StoryPlayer modal

#### StoryPlayer.tsx spec
Props: `{ story: Story }`
- Left panel: audio player (custom, no native controls) + waveform bars
- Right panel: scrollable transcript in original language
- Toggle: "Show translation" swaps transcript panel to English
- No sync highlighting needed for hackathon — just display the full transcript

#### Mock seed data (`lib/mock/storyMockData.ts`)
```ts
export const STORY_MOCK = [
  {
    _id: "story_001", type: "story", language_code: "mi",
    title: "How Māui Fished Up the North Island",
    author_name: "Hemi Walker",
    description: "A traditional account told by my grandfather in Te Reo Māori, recorded at his home in Rotorua.",
    audio_url: null,
    transcript: "I te tīmatanga, ko Māui anake i noho ki raro o te waka. I hopu ia i tōna matau...",
    transcript_translation: "In the beginning, Māui alone sat at the bottom of the canoe. He reached for his hook...",
    duration_seconds: 342,
    tags: ["creation", "ancestors", "ocean"],
    reactions: { "❤️": ["anon_1", "anon_2"], "🙏": ["anon_3"] },
    created_at: "2026-05-04T16:00:00Z"
  },
  {
    _id: "story_002", type: "story", language_code: "mi",
    title: "The Origin of the Kiwi Bird",
    author_name: "Aroha Tane",
    description: "Why the kiwi gave up its wings — as told in our village.",
    audio_url: null,
    transcript: "I tērā wā, he manu tino ātaahua te kiwi, me ōna parirau nui...",
    transcript_translation: "Long ago, the kiwi was a beautiful bird with great wings...",
    duration_seconds: 198,
    tags: ["animals", "forest", "origin"],
    reactions: { "✨": ["anon_alice"] },
    created_at: "2026-05-03T11:00:00Z"
  }
]
```

---

## Tab 4 — Moderator

**Route:** `?tab=moderator`

Only visible if `isModerator` is `true`. For the hackathon, store this as a simple cookie or hardcoded list of `author_id` values in `.env.local`.

```env
MODERATOR_IDS=anon_admin,anon_aryan
```

### What moderators see
A queue of all pending reports, grouped by content type (Dictionary Entry / Forum Post / Poem / Story).

Each report card shows:
- The reported content (inline preview)
- The report reason + optional note
- Reporter's anon ID + timestamp
- Two buttons: **Remove content** / **Dismiss report**

### Report system

#### Report data model (Cloudant `reports` DB)

```json
{
  "_id": "uuid",
  "type": "report",
  "content_type": "entry",
  "content_id": "uuid-of-the-entry",
  "language_code": "mi",
  "reason": "inaccurate_translation",
  "note": "This word actually means X not Y",
  "reporter_id": "anon_uuid",
  "status": "pending",
  "created_at": "2026-05-08T00:00:00Z"
}
```

`content_type` is one of: `entry` | `post` | `poem` | `story`

`reason` is one of: `inaccurate_translation` | `offensive_content` | `incorrect_audio` | `spam` | `other`

`status` is one of: `pending` | `removed` | `dismissed`

#### API routes
```
POST /api/reports                          → submit a report (any user)
GET  /api/reports?status=pending           → get report queue (moderator only)
PATCH /api/reports/[id]                    → update status to removed or dismissed (moderator only)
```

#### Components
```
components/ReportModal.tsx                 # triggered from flag icon on any content card
components/moderator/ReportCard.tsx        # single report in the queue with preview + action buttons
components/moderator/ModeratorQueue.tsx    # full list of ReportCards, filterable by content_type
```

#### ReportModal.tsx spec
Props: `{ contentType: string, contentId: string, onClose: () => void }`
- Dropdown: reason selector
- Optional text area: "Additional details"
- Submit button → `POST /api/reports`
- On success: replace modal content with "Thank you — a moderator will review this"

#### Report flag placement
Add a small flag icon (🚩 or outline flag SVG) to:
- `components/DictionaryEntry.tsx` — top-right corner
- `components/forum/PostCard.tsx` — top-right corner
- `components/poetry/PoemCard.tsx` — top-right corner
- `components/storytelling/StoryCard.tsx` — top-right corner

Clicking it opens `ReportModal` with the appropriate `contentType` and `contentId`.

---

## Cloudant Databases (full list)

| Database | Contents |
|---|---|
| `languages` | Language metadata documents |
| `entries` | Dictionary word entries |
| `posts` | Forum posts and replies |
| `poetry` | Poems |
| `stories` | Oral tradition recordings |
| `reports` | Moderation reports |

### Mango indexes to create for new databases

**`posts` DB:**
```json
{ "index": { "fields": ["language_code", "section", "depth"] }, "name": "posts-by-language", "type": "json" }
{ "index": { "fields": ["root_id"] }, "name": "posts-by-root", "type": "json" }
```

**`poetry` DB:**
```json
{ "index": { "fields": ["language_code"] }, "name": "poetry-by-language", "type": "json" }
```

**`stories` DB:**
```json
{ "index": { "fields": ["language_code"] }, "name": "stories-by-language", "type": "json" }
```

**`reports` DB:**
```json
{ "index": { "fields": ["status", "content_type"] }, "name": "reports-by-status", "type": "json" }
```

---

## Full File Map

```
lang-legacy/
├── whisper_server.py                            # ← NEEDS CREATING
├── app/
│   ├── layout.tsx                               # ✅ exists
│   ├── page.tsx                                 # ✅ exists — language selector
│   ├── globals.css                              # ✅ exists
│   ├── [language]/
│   │   ├── page.tsx                             # ✅ exists — ADD tab bar + tab routing
│   │   └── contribute/
│   │       └── page.tsx                         # ✅ exists
│   └── api/
│       ├── transcribe/route.ts                  # ✅ exists
│       ├── extract/route.ts                     # ✅ exists
│       ├── entries/route.ts                     # ✅ exists — ADD report flag support
│       ├── languages/route.ts                   # ✅ exists
│       ├── posts/
│       │   ├── route.ts                         # ← NEEDS CREATING
│       │   └── [id]/
│       │       ├── route.ts                     # ← NEEDS CREATING
│       │       ├── reply/route.ts               # ← NEEDS CREATING
│       │       └── react/route.ts               # ← NEEDS CREATING
│       ├── poetry/
│       │   ├── route.ts                         # ← NEEDS CREATING
│       │   └── [id]/react/route.ts              # ← NEEDS CREATING
│       ├── stories/
│       │   ├── route.ts                         # ← NEEDS CREATING
│       │   └── [id]/react/route.ts              # ← NEEDS CREATING
│       └── reports/
│           ├── route.ts                         # ← NEEDS CREATING
│           └── [id]/route.ts                    # ← NEEDS CREATING
├── components/
│   ├── AudioPlayer.tsx                          # ✅ exists
│   ├── AudioRecorder.tsx                        # ✅ exists
│   ├── DictionaryEntry.tsx                      # ✅ exists — ADD report flag icon
│   ├── SearchBar.tsx                            # ✅ exists
│   ├── LanguageCard.tsx                         # ✅ exists
│   ├── UploadFlow.tsx                           # ✅ exists
│   ├── FlashCard.tsx                            # ← NEEDS CREATING
│   ├── LearnSession.tsx                         # ← NEEDS CREATING
│   ├── ReportModal.tsx                          # ← NEEDS CREATING
│   ├── forum/
│   │   ├── PostCard.tsx                         # ← NEEDS CREATING
│   │   ├── PostComposer.tsx                     # ← NEEDS CREATING
│   │   ├── ReactionBar.tsx                      # ← NEEDS CREATING
│   │   └── ReplyThread.tsx                      # ← NEEDS CREATING
│   ├── poetry/
│   │   ├── PoemCard.tsx                         # ← NEEDS CREATING
│   │   ├── PoemComposer.tsx                     # ← NEEDS CREATING
│   │   └── PoetryGallery.tsx                    # ← NEEDS CREATING
│   ├── storytelling/
│   │   ├── StoryCard.tsx                        # ← NEEDS CREATING
│   │   ├── StoryPlayer.tsx                      # ← NEEDS CREATING
│   │   ├── StoryComposer.tsx                    # ← NEEDS CREATING
│   │   └── StoryLibrary.tsx                     # ← NEEDS CREATING
│   └── moderator/
│       ├── ReportCard.tsx                       # ← NEEDS CREATING
│       └── ModeratorQueue.tsx                   # ← NEEDS CREATING
├── lib/
│   ├── watsonx.ts                               # ✅ exists
│   ├── cloudant.ts                              # ✅ exists
│   ├── cos.ts                                   # ✅ exists — NEEDS REPLACING (Cloudinary)
│   ├── whisper.ts                               # ✅ exists — NEEDS REPLACING (local server)
│   ├── types.ts                                 # ✅ exists — ADD new types below
│   └── mock/
│       ├── forumMockData.ts                     # ← NEEDS CREATING
│       ├── poetryMockData.ts                    # ← NEEDS CREATING
│       └── storyMockData.ts                     # ← NEEDS CREATING
├── .env.local                                   # ← fill in credentials
└── CLAUDE.md                                    # this file
```

---

## TypeScript Types — Add to `lib/types.ts`

```typescript
// Existing types stay — add these below

export type Post = {
  _id: string
  type: 'post'
  section: 'forum'
  language_code: string
  author_name: string
  author_id: string
  body: string
  parent_id: string | null
  root_id: string | null
  depth: number
  reactions: Record<string, string[]>
  created_at: string
}

export type Poem = {
  _id: string
  type: 'poem'
  language_code: string
  title: string
  author_name: string
  body_original: string
  body_translation: string
  audio_url: string | null
  reactions: Record<string, string[]>
  created_at: string
}

export type Story = {
  _id: string
  type: 'story'
  language_code: string
  title: string
  author_name: string
  description: string
  audio_url: string | null
  transcript: string
  transcript_translation: string
  duration_seconds: number
  tags: string[]
  reactions: Record<string, string[]>
  created_at: string
}

export type Report = {
  _id: string
  type: 'report'
  content_type: 'entry' | 'post' | 'poem' | 'story'
  content_id: string
  language_code: string
  reason: 'inaccurate_translation' | 'offensive_content' | 'incorrect_audio' | 'spam' | 'other'
  note: string
  reporter_id: string
  status: 'pending' | 'removed' | 'dismissed'
  created_at: string
}
```

---

## Cloudinary Integration (`lib/cos.ts` — NEEDS REPLACING)

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
  form.append('resource_type', 'video')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: 'POST', body: form }
  )

  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`)
  const data = await res.json()
  return data.secure_url
}
```

---

## Local Whisper Setup

### `whisper_server.py` (create in project root)

```python
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile, os, uvicorn

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["POST"], allow_headers=["*"])

model = WhisperModel("base", device="cuda", compute_type="float16")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language_code: str = Form(default=None)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name
    try:
        segments, info = model.transcribe(tmp_path, language=language_code if language_code else None)
        transcript = " ".join(s.text for s in segments).strip()
        return {"transcript": transcript, "language_code": language_code}
    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Install: `pip install faster-whisper fastapi uvicorn python-multipart`

### `lib/whisper.ts` (NEEDS REPLACING)

```typescript
export async function transcribeAudio(
  audioFile: File,
  languageCode?: string
): Promise<{ transcript: string; language_code: string }> {
  const form = new FormData()
  form.append('audio', audioFile)
  if (languageCode) form.append('language_code', languageCode)
  const res = await fetch(`${process.env.WHISPER_SERVER_URL}/transcribe`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Whisper server error: ${res.status}`)
  return res.json()
}
```

### Run during development
```bash
# Terminal 1
python whisper_server.py

# Terminal 2
npm run dev
```

---

## Prompting Rules for Cursor

- **Never scaffold or recreate** files marked ✅ — edit only
- **One file at a time** — always name the exact file path
- **After any edit** run `npm run build`
- **For new files** — say "Create [filepath] with the following spec from CLAUDE.md"

### Prompt patterns

```
"Edit only lib/cos.ts — replace its contents with the Cloudinary version from CLAUDE.md."

"Edit only lib/whisper.ts — replace its contents with the local server version from CLAUDE.md."

"Create whisper_server.py in the project root using the spec in CLAUDE.md."

"Create components/forum/PostCard.tsx using the spec in CLAUDE.md. Do not touch any other file."

"Create components/poetry/PoemCard.tsx using the spec in CLAUDE.md. Do not touch any other file."

"Create components/storytelling/StoryCard.tsx using the spec in CLAUDE.md. Do not touch any other file."

"Edit only app/[language]/page.tsx — add a tab bar with four tabs: Dictionary, Learn, Community, Moderator. Tab state lives in the URL as ?tab=. Do not touch any other file."

"Create components/ReportModal.tsx using the spec in CLAUDE.md. Do not touch any other file."

"Edit only components/DictionaryEntry.tsx — add a flag icon in the top-right corner that opens ReportModal. Do not touch any other file."
```

---

## What to Ignore

- User auth / login (use anonymous IDs stored in localStorage)
- Real-time chat (polling every 30s is fine for demo)
- Transcript sync highlighting in StoryPlayer
- Pagination (client-side filtering at demo scale)
- Real-time waveform (CSS bars only)
- Full error boundary polish
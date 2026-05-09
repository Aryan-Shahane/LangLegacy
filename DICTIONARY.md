DICTIONARY_TAB.md

# LangLegacy — Dictionary System

## Purpose

The Dictionary System is the core feature of LangLegacy.

It allows communities to:
- preserve endangered languages
- upload spoken audio
- automatically transcribe speech
- extract vocabulary using AI
- create searchable audio dictionary entries
- collaboratively expand language archives

The Dictionary System is designed to function as:
- a language archive
- a pronunciation reference
- a collaborative contribution platform
- a searchable audio dictionary
- a cultural preservation tool

---

# High-Level User Flow

```text
Browse Languages
      ↓
Select Existing Language
   OR
Create New Language
      ↓
Record / Upload Audio
      ↓
Local Whisper Transcription
      ↓
IBM watsonx Vocabulary Extraction
      ↓
User Reviews Extracted Entries
      ↓
Save Entries to Cloudant
      ↓
Search + Playback + Community Expansion
````

---

# Primary User Experiences

## 1. Browse Languages

Users first land on a Language Explorer page.

Route:

```text
/
```

The page displays:

* searchable language cards
* featured languages
* recently active languages
* contribution statistics
* "Add Your Language" CTA

---

# Homepage Structure

```text
app/page.tsx
│
├── Hero Section
├── Search Languages
├── Featured Languages
├── Language Grid
├── Recent Contributions
└── Add Language Button
```

---

# Language Card UI

Each language card displays:

* language name
* region
* speaker count
* total dictionary entries
* contributor count
* latest activity timestamp

Example:

```text
┌─────────────────────────┐
│ Māori                   │
│ New Zealand             │
│ 1,204 entries           │
│ 42 contributors         │
│ Updated 2h ago          │
│                         │
│ [ Open Dictionary ]     │
└─────────────────────────┘
```

---

# Existing Seed Languages

Initial languages:

* Māori (`mi`)
* Welsh (`cy`)
* Cornish (`kw`)

Stored in:

```text
languages
```

Cloudant database.

---

# 2. Add Language Flow

Users can create entirely new language collections.

CTA:

```text
+ Add Your Language
```

---

# Add Language Modal

Component:

```text
components/AddLanguageModal.tsx
```

Fields:

| Field           | Required | Purpose                    |
| --------------- | -------- | -------------------------- |
| Language Name   | Yes      | Display name               |
| Language Code   | Yes      | ISO/custom identifier      |
| Region          | Yes      | Geographic/cultural region |
| Description     | No       | Language background        |
| Native Script   | No       | Original writing system    |
| Sample Greeting | No       | Example phrase             |

---

# Add Language UX Flow

```text
1. User clicks "Add Your Language"
2. Modal opens
3. User fills language metadata
4. Submit form
5. Language document saved to Cloudant
6. Redirect to new language dictionary page
```

---

# Language Document Schema

```json
{
  "_id": "mi",
  "type": "language",
  "name": "Māori",
  "code": "mi",
  "region": "New Zealand",
  "description": "Polynesian language of the Māori people",
  "native_script": "Latin",
  "entry_count": 0,
  "contributor_count": 0,
  "created_at": "2026-05-08T00:00:00Z"
}
```

---

# Permissions

## Public Users

Can:

* browse languages
* search entries
* listen to audio

## Authenticated Users

Can:

* contribute entries
* create languages
* report entries

## Moderators

Can:

* remove entries
* review reports
* moderate language collections

---

# 3. Language Dictionary Page

Route:

```text
/[language]
```

Example:

```text
/mi
```

---

# Dictionary Page Structure

```text
app/[language]/page.tsx
│
├── Language Header
├── Search Bar
├── Contribute Button
├── Dictionary Entries
├── Empty State
└── Infinite Scroll / Pagination
```

---

# Language Header

Displays:

* language name
* region
* total entries
* contributor count
* latest contribution timestamp

---

# Search System

Users can search by:

* word
* translation
* partial matches
* contributor (future)
* tags (future)

Component:

```text
components/SearchBar.tsx
```

---

# Dictionary Entry Card

Each entry displays:

* word
* translation
* definition
* pronunciation audio
* contributor
* timestamps
* report button

Example:

```text
┌──────────────────────────────┐
│ kia ora                      │
│ hello                        │
│ Greeting in Māori            │
│ ▶ Play Audio                 │
│ Contributed by Te Ao         │
│ ⚑ Report                     │
└──────────────────────────────┘
```

---

# Dictionary Entry Schema

```json
{
  "_id": "uuid",
  "type": "entry",
  "language_code": "mi",
  "word": "kia ora",
  "translation": "hello",
  "definition": "Greeting in Māori",
  "audio_url": "https://...",
  "contributor_id": "user_uuid",
  "contributor_name": "Te Ao",
  "report_count": 0,
  "status": "active",
  "created_at": "2026-05-08T00:00:00Z"
}
```

---

# Entry Status Values

```text
active
removed
under_review
```

---

# 4. Contribution System

Users contribute vocabulary through:

* recording audio
* uploading existing audio

---

# Contribution CTA

```text
+ Contribute Recording
```

---

# Contribution Flow

```text
1. User clicks "Contribute Recording"
2. Modal/page opens
3. User records OR uploads audio
4. Audio preview shown
5. User submits recording
6. Audio uploaded to Cloudinary
7. Audio sent to local Whisper server
8. Transcript returned
9. Transcript sent to watsonx
10. Vocabulary extracted
11. User reviews extracted entries
12. User edits/corrects entries
13. Entries saved to Cloudant
14. Dictionary updates immediately
```

---

# Audio Recording

Component:

```text
components/AudioRecorder.tsx
```

Features:

* start recording
* stop recording
* playback preview
* delete/re-record
* waveform animation (optional)

---

# Audio Upload

Component:

```text
components/UploadFlow.tsx
```

Supported formats:

* `.mp3`
* `.wav`
* `.m4a`

---

# 5. Cloudinary Storage

Audio files are stored in Cloudinary.

File:

```text
lib/cos.ts
```

Function:

```typescript
uploadAudio(key, buffer, contentType)
```

Returns:

```text
secure_url
```

Purpose:

* scalable storage
* fast CDN playback
* lightweight infrastructure

---

# 6. Local Whisper Transcription

Speech-to-text runs locally using:

* faster-whisper
* FastAPI
* CUDA acceleration

Server:

```text
whisper_server.py
```

Runs on:

```text
http://localhost:8000
```

---

# Transcription Flow

```text
Frontend Upload
      ↓
POST /transcribe
      ↓
Local Whisper Server
      ↓
Transcript JSON
```

---

# Example Transcript Response

```json
{
  "transcript": "Kia ora koutou katoa",
  "language_code": "mi"
}
```

---

# 7. IBM watsonx Extraction

After transcription:

* transcript is sent to IBM watsonx
* Granite model extracts vocabulary
* entries are returned as structured JSON

Model:

```text
ibm/granite-13b-instruct-v2
```

File:

```text
lib/watsonx.ts
```

---

# Extraction Goal

Convert raw speech into:

* words
* phrases
* translations
* definitions
* pronunciation references
* example usage

---

# Example Extracted Entry

```json
{
  "word": "kia ora",
  "translation": "hello",
  "definition": "Greeting in Māori",
  "audio_url": "https://..."
}
```

---

# 8. Entry Review System

Before saving:

* extracted entries appear in editable cards
* users can correct definitions
* users can delete bad entries
* users can merge duplicates

Purpose:

* improve AI accuracy
* preserve cultural nuance
* enable collaborative curation

---

# Duplicate Detection

Before insertion:

* query existing entries
* fuzzy match:

  * word
  * language
  * translation

If duplicate confidence exceeds threshold:

* show warning
* allow merge/update instead

Example warning:

```text
Possible duplicate entry detected.
Would you like to merge or create a new entry?
```

---

# 9. Cloudant Storage

Primary databases:

| Database  | Purpose            |
| --------- | ------------------ |
| languages | Language metadata  |
| entries   | Dictionary entries |
| users     | Contributors       |
| reports   | Moderation reports |

---

# Search Indexes

Required indexes:

```json
{ "index": { "fields": ["language_code", "type"] }, "name": "language-entries-index", "type": "json" }

{ "index": { "fields": ["word", "translation"] }, "name": "word-search-index", "type": "text" }
```

---

# 10. Audio Playback

Each entry supports:

* pronunciation playback
* replay controls
* streaming from Cloudinary

Component:

```text
components/AudioPlayer.tsx
```

---

# Empty States

## No Languages

```text
No language archives yet.
Start the first one.
```

---

## No Dictionary Entries

```text
Be the first contributor to preserve this language.
```

---

# Loading States

## During Upload

```text
Uploading audio...
```

## During Transcription

```text
Transcribing speech...
```

## During Extraction

```text
Extracting vocabulary...
```

---

# Error States

## Upload Failure

```text
Audio upload failed. Please try again.
```

## Whisper Failure

```text
Transcription server unavailable.
```

## watsonx Failure

```text
Vocabulary extraction failed.
```

---

# Moderation

Every dictionary entry includes:

```text
⚑ Report
```

Users can report:

* misinformation
* offensive content
* spam
* incorrect translations

Reported entries enter moderation review.

---

# Existing Files

## Already Implemented

```text
app/[language]/page.tsx
components/DictionaryEntry.tsx
components/AudioPlayer.tsx
components/AudioRecorder.tsx
components/SearchBar.tsx
components/UploadFlow.tsx
app/api/transcribe/route.ts
app/api/extract/route.ts
app/api/entries/route.ts
lib/watsonx.ts
lib/cloudant.ts
```

---

# Files Still Needing Work

## Create

```text
components/AddLanguageModal.tsx
components/LanguageExplorer.tsx
whisper_server.py
```

---

## Replace

```text
lib/cos.ts
lib/whisper.ts
```

---

## Edit

```text
app/page.tsx
app/[language]/page.tsx
components/DictionaryEntry.tsx
```

---

# Future Improvements

Planned:

* semantic search
* IPA pronunciation support
* contributor reputation
* AI-generated example sentences
* dialect linking
* phonetic search
* version history
* collaborative editing
* automatic language detection

---

# Core Goal

The Dictionary System should evolve into a globally accessible,
community-driven archive for endangered and underrepresented languages.

It should preserve:

* pronunciation
* vocabulary
* cultural context
* oral tradition
* community knowledge

through collaborative AI-assisted tooling.

```
```

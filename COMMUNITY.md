# Community Tab — Build Tasks

## Overview

The Community tab lives at `?tab=community` inside `app/[language]/page.tsx`.
It is a language-specific social feed where users post text or audio, react with
emojis, and reply to one another in a threaded conversation.

---

## Current Problems

| Problem | Details |
|---|---|
| Reply threading is broken | Replying to a reply creates a new top-level post instead of nesting correctly |
| Tab is empty | No seed data; the feed renders blank on first load |
| No reply-depth guard | UI allows infinite nesting, which breaks layout |

---

## Files to Touch (one at a time)

```
app/api/posts/route.ts          ← GET / POST posts
app/api/posts/[id]/route.ts     ← GET single post + DELETE
app/api/posts/[id]/reply/route.ts ← POST a reply to any post or reply
app/api/posts/[id]/react/route.ts ← POST emoji reaction
components/PostCard.tsx
components/PostComposer.tsx
components/ReactionBar.tsx
components/ReplyThread.tsx      ← new component
lib/mock/communityMockData.ts   ← new file
```

---

## Fix: Replying to Replies

### Root Cause

Replies are stored with a flat `parentId` pointing only to top-level posts.
When a user replies to a reply, the `parentId` is lost and the post is
re-parented to the thread root, or worse, creates a new root post.

### Data Model Fix

```ts
// Cloudant document shape
interface Post {
  _id: string
  language: string
  authorId: string
  authorName: string
  body: string
  audioUrl?: string
  parentId: string | null   // null = top-level post
  rootId: string | null     // always points to the original top-level post
  depth: number             // 0 = top-level, 1 = reply, 2 = reply-to-reply (max)
  reactions: Record<string, string[]>  // emoji → [userId, ...]
  createdAt: string
}
```

### API Change — `app/api/posts/[id]/reply/route.ts`

```ts
// Edit only app/api/posts/[id]/reply/route.ts

export async function POST(req, { params }) {
  const parent = await getPost(params.id)

  // Clamp depth: reply-to-reply is the deepest allowed (depth 2)
  const depth = Math.min((parent.depth ?? 0) + 1, 2)

  // rootId always traces back to the original top-level post
  const rootId = parent.rootId ?? parent._id

  const newPost = {
    ...bodyFromRequest,
    parentId: parent._id,
    rootId,
    depth,
  }
  // save to Cloudant ...
}
```

### UI Fix — `components/ReplyThread.tsx`

- Render replies grouped under their `rootId`
- Show max 2 levels of visual indentation
- At depth 2, the "Reply" button still works but the new post gets `depth: 2`
  and is appended flat under the same root (Twitter-style continuation)
- Collapse threads longer than 3 replies behind a "Show N more replies" toggle

```tsx
// Edit only components/ReplyThread.tsx

// Props
interface ReplyThreadProps {
  rootPost: Post
  replies: Post[]          // all replies with rootId === rootPost._id
}

// Render tree:
// rootPost (depth 0)
//   ├─ reply A (depth 1)
//   │    └─ reply to A (depth 2, indented once more, then flat)
//   └─ reply B (depth 1)
```

---

## Mock Data

### Create `lib/mock/communityMockData.ts`

Seed 6 posts that demonstrate all content types:

```ts
// Edit only lib/mock/communityMockData.ts

export const MOCK_POSTS = [
  {
    _id: "post_001",
    language: "navajo",
    authorId: "user_alice",
    authorName: "Alice Runningwater",
    body: "Just recorded my grandmother saying 'yá'át'ééh' — the way she pronounces it is so different from what I learned in class!",
    audioUrl: null,
    parentId: null,
    rootId: null,
    depth: 0,
    reactions: { "❤️": ["user_bob", "user_carol"], "🙏": ["user_dave"] },
    createdAt: "2025-05-08T10:22:00Z",
  },
  {
    _id: "post_002",
    language: "navajo",
    authorId: "user_bob",
    authorName: "Bob Tsosie",
    body: "Dialectal variation! Which region is she from? The Western dialect softens that initial glottal stop.",
    audioUrl: null,
    parentId: "post_001",
    rootId: "post_001",
    depth: 1,
    reactions: { "💡": ["user_alice"] },
    createdAt: "2025-05-08T10:45:00Z",
  },
  {
    _id: "post_003",
    language: "navajo",
    authorId: "user_alice",
    authorName: "Alice Runningwater",
    body: "She's from Chinle — is that Western?",
    audioUrl: null,
    parentId: "post_002",
    rootId: "post_001",
    depth: 2,
    reactions: {},
    createdAt: "2025-05-08T11:00:00Z",
  },
  {
    _id: "post_004",
    language: "navajo",
    authorId: "user_carol",
    authorName: "Carol Begay",
    body: "Does anyone have a recording of the word for 'thunder'? I want to compare it to what's in the dictionary.",
    audioUrl: null,
    parentId: null,
    rootId: null,
    depth: 0,
    reactions: { "🔊": ["user_alice", "user_dave", "user_eve"] },
    createdAt: "2025-05-07T18:30:00Z",
  },
  {
    _id: "post_005",
    language: "navajo",
    authorId: "user_dave",
    authorName: "Dave Nez",
    body: "Added a new entry for 'níłch'i' (wind/air). Check it out in the dictionary — I included three regional pronunciations.",
    audioUrl: null,
    parentId: null,
    rootId: null,
    depth: 0,
    reactions: { "🎉": ["user_alice", "user_bob", "user_carol", "user_eve"] },
    createdAt: "2025-05-07T09:15:00Z",
  },
  {
    _id: "post_006",
    language: "navajo",
    authorId: "user_eve",
    authorName: "Eve Yazzie",
    body: "Reminder: community recording session this Saturday at 2pm MT over video call. DM me for the link!",
    audioUrl: null,
    parentId: null,
    rootId: null,
    depth: 0,
    reactions: { "✅": ["user_alice", "user_bob", "user_dave"] },
    createdAt: "2025-05-06T20:00:00Z",
  },
]
```

### Wire Mock Data into GET Route

```ts
// Edit only app/api/posts/route.ts

// During development, fall back to mock data if Cloudant is unreachable
import { MOCK_POSTS } from "@/lib/mock/communityMockData"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const language = searchParams.get("language")

  try {
    const posts = await cloudant.fetchPostsByLanguage(language)
    return Response.json(posts)
  } catch {
    const filtered = MOCK_POSTS.filter(p => p.language === language)
    return Response.json(filtered)
  }
}
```

---

## Component Checklist

### `PostCard.tsx`
- [ ] Renders `body` text and optional audio player
- [ ] Shows `authorName` + relative timestamp
- [ ] Renders `ReactionBar` inline
- [ ] "Reply" button opens inline `PostComposer` pre-filled with `parentId`
- [ ] Passes `rootId` and `depth` through to the reply composer

### `PostComposer.tsx`
- [ ] Text area + optional audio record button
- [ ] Hidden fields: `parentId`, `rootId`, `depth`
- [ ] Submits to `POST /api/posts` (top-level) or `POST /api/posts/[id]/reply`
- [ ] Clears and collapses after successful submit

### `ReactionBar.tsx`
- [ ] Displays emoji counts from `reactions` map
- [ ] Click toggles your userId in/out of that emoji's array
- [ ] Preset emoji picker: ❤️ 🙏 💡 🔊 🎉 ✅

### `ReplyThread.tsx` *(new)*
- [ ] Accepts `rootPost` + flat `replies[]`
- [ ] Groups by `depth` for visual indentation
- [ ] Collapses >3 replies behind "Show N more"
- [ ] Max visual indent = 2 levels regardless of actual depth

---

## Acceptance Criteria

- [ ] Feed loads with mock posts when Cloudant is down
- [ ] New top-level posts appear immediately (optimistic update)
- [ ] Replying to a reply nests correctly under the same root thread
- [ ] Depth never exceeds 2 in the database
- [ ] Reactions toggle correctly per user
- [ ] No layout breakage at mobile widths

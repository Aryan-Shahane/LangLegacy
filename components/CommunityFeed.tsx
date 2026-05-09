"use client";

import { useMemo, useState } from "react";

type FeedComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type FeedPost = {
  id: string;
  author: string;
  authorTag: string;
  body: string;
  createdAt: string;
  likes: number;
  likedByViewer: boolean;
  comments: FeedComment[];
};

const MOCK_POSTS: FeedPost[] = [
  {
    id: "p1",
    author: "Ari Te Rangi",
    authorTag: "Elder Storykeeper",
    body: "Heard three youth read their first full proverb today. Moments like this keep our language breathing.",
    createdAt: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    likes: 14,
    likedByViewer: false,
    comments: [
      {
        id: "c1",
        author: "Mina K.",
        body: "This is beautiful. Could we record it for the archive?",
        createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
      },
    ],
  },
  {
    id: "p2",
    author: "R. Morgan",
    authorTag: "Language Teacher",
    body: "New beginner circle this Saturday. Bring one family phrase you want to preserve and share.",
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    likes: 22,
    likedByViewer: true,
    comments: [
      {
        id: "c2",
        author: "Leah",
        body: "I will bring my grandmother's greeting phrase.",
        createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
      {
        id: "c3",
        author: "Tane",
        body: "Can younger kids join too?",
        createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      },
    ],
  },
];

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function CommunityFeed({ languageCode }: { languageCode: string }) {
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);
  const [draft, setDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const postCountLabel = useMemo(() => `${posts.length} ${posts.length === 1 ? "post" : "posts"}`, [posts.length]);
  const languageLabel = (languageCode || "unknown").toUpperCase();

  const submitPost = () => {
    const text = draft.trim();
    if (!text) return;
    const next: FeedPost = {
      id: `p-${Date.now()}`,
      author: "You",
      authorTag: "Community Member",
      body: text,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByViewer: false,
      comments: [],
    };
    setPosts((prev) => [next, ...prev]);
    setDraft("");
  };

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.likedByViewer;
        return {
          ...post,
          likedByViewer: liked,
          likes: post.likes + (liked ? 1 : -1),
        };
      }),
    );
  };

  const addComment = (postId: string) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    const nextComment: FeedComment = {
      id: `c-${Date.now()}`,
      author: "You",
      body: text,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, nextComment] } : post)),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <section className="space-y-3">
      <div className="panel space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Community feed for {languageLabel}</span>
          <span>{postCountLabel}</span>
        </div>
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share an update with your language community..."
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submitPost}
            className="rounded bg-cyan-700 px-3 py-2 text-sm font-medium hover:bg-cyan-600"
          >
            Post update
          </button>
        </div>
      </div>

      {posts.map((post) => (
        <article key={post.id} className="panel space-y-3">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">{post.author}</p>
              <p className="text-xs text-slate-400">{post.authorTag}</p>
            </div>
            <p className="text-xs text-slate-500">{formatTime(post.createdAt)}</p>
          </header>

          <p className="whitespace-pre-wrap text-sm text-slate-200">{post.body}</p>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => toggleLike(post.id)}
              className={`rounded-full border px-3 py-1 ${
                post.likedByViewer
                  ? "border-cyan-500 bg-cyan-950 text-cyan-200"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {post.likedByViewer ? "Liked" : "Like"} ({post.likes})
            </button>
            <span className="text-slate-400">
              {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>

          <div className="space-y-2 rounded border border-slate-800 bg-slate-950/60 p-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="rounded border border-slate-800 bg-slate-900 px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-200">{comment.author}</p>
                  <p className="text-[11px] text-slate-500">{formatTime(comment.createdAt)}</p>
                </div>
                <p className="text-xs text-slate-300">{comment.body}</p>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={commentDrafts[post.id] || ""}
                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                placeholder="Write a comment..."
                className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => addComment(post.id)}
                className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              >
                Comment
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

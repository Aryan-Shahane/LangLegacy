"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import { Card } from "@/components/ui/card";
import type { Post } from "@/lib/types";

export default function CommunityFeed({ languageCode }: { languageCode: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
    const res = await fetch(`/api/posts?language_code=${encodeURIComponent(languageCode)}`);
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Failed to load community posts.");
    }
    setPosts((await res.json()) as Post[]);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadPosts();
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load community posts.");
      }
      if (mounted) setLoading(false);
    };
    void run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageCode]);

  const topLevelPosts = posts.filter((p) => !p.parent_post_id);
  const repliesByParent = posts.reduce<Record<string, Post[]>>((acc, post) => {
    if (post.parent_post_id) {
      acc[post.parent_post_id] = acc[post.parent_post_id] || [];
      acc[post.parent_post_id].push(post);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card className="bg-[#F5F3EE] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#737973]">Story Vault</p>
        <h2 className="mt-2 font-serif text-4xl leading-tight text-[#061B0E]">Community Textbook</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#434843]">
          Preserve everyday expressions, elder stories, and pronunciation notes in a readable archive that future learners can trust.
        </p>
      </Card>
      <PostComposer
        onSubmit={async (body) => {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language_code: languageCode, body }),
          });
          if (!res.ok) {
            const payload = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error || "Unable to publish post.");
          }
          await loadPosts();
        }}
      />
      {topLevelPosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          replies={(repliesByParent[post._id] || []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at))}
          onReact={async (targetPostId, emoji) => {
            await fetch(`/api/posts/${targetPostId}/react`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emoji }),
            });
            await loadPosts();
          }}
          onReport={async (postIdForReport, payload) => {
            const res = await fetch(`/api/posts/${postIdForReport}/report`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, language_code: languageCode }),
            });
            if (!res.ok) {
              const errJson = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(errJson.error || "Report failed.");
            }
          }}
          onReply={async ({ parentPostId, replyToAuthor, body }) => {
            const res = await fetch("/api/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                language_code: languageCode,
                body,
                parent_post_id: parentPostId,
                reply_to_author: replyToAuthor,
              }),
            });
            if (!res.ok) {
              const payload = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(payload.error || "Unable to publish reply.");
            }
            await loadPosts();
          }}
        />
      ))}
      {!loading && posts.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-serif text-2xl text-[#061B0E]">No entries yet</p>
          <p className="mt-1 text-sm text-[#434843]">Start the first page of this language textbook by posting a story.</p>
        </Card>
      ) : null}
      {loading ? <p className="text-sm text-[#434843]">Loading community textbook entries...</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

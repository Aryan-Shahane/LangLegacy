"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PostCard from "@/components/forum/PostCard";
import PostComposer from "@/components/forum/PostComposer";
import { organizeForumPosts } from "@/components/forum/ReplyThread";
import { Card } from "@/components/ui/card";
import type { Post } from "@/lib/types";

type MePayload = {
  authenticated?: boolean;
  user?: { userId: string; role: string };
};

export default function ForumPanel({ languageCode }: { languageCode: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const res = await fetch(
      `/api/posts?language_code=${encodeURIComponent(languageCode)}&section=forum`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Failed to load forum.");
    }
    setPosts((await res.json()) as Post[]);
  }, [languageCode]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadPosts();
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load forum.");
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadPosts]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as MePayload;
        if (cancelled || !data.authenticated || !data.user) return;
        setViewerUserId(data.user.userId);
        setViewerRole(data.user.role);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canModeratePosts = viewerRole === "moderator" || viewerRole === "admin";
  const { roots, getChildren } = useMemo(() => organizeForumPosts(posts), [posts]);

  const tryDeletePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Delete failed.");
    }
    await loadPosts();
  };

  const onMaybeDelete =
    viewerUserId
      ? async (postId: string) => {
          const doc = posts.find((x) => x._id === postId);
          if (doc?.author_id === viewerUserId || canModeratePosts) await tryDeletePost(postId);
          else throw new Error("You can only delete your own posts.");
        }
      : undefined;

  return (
    <div className="space-y-4">
      <Card className="bg-[#F5F3EE] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#737973]">Forum</p>
        <h2 className="mt-2 font-serif text-4xl leading-tight text-[#061B0E]">Speaker &amp; learner threads</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#434843]">
          Ask questions, compare dialects, and share pronunciation tips in threaded discussions.
        </p>
      </Card>

      <PostComposer
        title="New thread"
        onSubmit={async (body) => {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language_code: languageCode, body }),
          });
          if (!res.ok) {
            const payload = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error || "Unable to publish.");
          }
          await loadPosts();
        }}
      />

      {roots.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          getChildren={getChildren}
          languageCode={languageCode}
          depth={0}
          onReact={async (targetPostId, emoji) => {
            await fetch(`/api/posts/${targetPostId}/react`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emoji }),
            });
            await loadPosts();
          }}
          onReply={async ({ parentPostId, replyToAuthor, body }) => {
            const res = await fetch(`/api/posts/${parentPostId}/reply`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                language_code: languageCode,
                body,
                reply_to_author: replyToAuthor,
              }),
            });
            if (!res.ok) {
              const payload = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(payload.error || "Unable to publish reply.");
            }
            await loadPosts();
          }}
          onDelete={onMaybeDelete}
        />
      ))}

      {loading ? <p className="text-sm text-[#434843]">Loading forum…</p> : null}
      {!loading && error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && roots.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-serif text-2xl text-[#061B0E]">No threads yet</p>
          <p className="mt-1 text-sm text-[#434843]">Start the conversation with your first forum post.</p>
        </Card>
      ) : null}
    </div>
  );
}

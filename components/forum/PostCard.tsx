"use client";

import { useMemo, useState } from "react";
import ReactionBar from "@/components/forum/ReactionBar";
import ReportModal from "@/components/ReportModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { reactionCountsForUi } from "@/lib/forumCoerce";
import type { Post } from "@/lib/types";

export default function PostCard({
  post,
  getChildren,
  languageCode,
  depth,
  onReact,
  onReply,
  onDelete,
}: {
  post: Post;
  getChildren: (id: string) => Post[];
  languageCode: string;
  depth: number;
  onReact: (postId: string, emoji: string) => Promise<void>;
  onReply: (payload: { parentPostId: string; replyToAuthor: string; body: string }) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
}) {
  const replies = useMemo(
    () => [...getChildren(post._id)].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [getChildren, post._id]
  );

  const when = useMemo(() => new Date(post.created_at).toLocaleString(), [post.created_at]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const indentClass =
    depth === 0 ? "" : depth === 1 ? "ml-4 border-l border-[#C3C8C1]/35 pl-4" : "ml-8 border-l border-[#C3C8C1]/35 pl-4";
  const maxPreview = 3;
  const extra = replies.length - maxPreview;
  const visibleReplies = expandedReplies || extra <= 0 ? replies : replies.slice(0, maxPreview);

  const reactions = reactionCountsForUi(post);

  return (
    <div className={indentClass}>
      <Card className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-xl leading-tight text-[#061B0E]">{post.author_name}</p>
            <p className="text-xs uppercase tracking-[0.12em] text-[#737973]">{when}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {onDelete ? (
              <button
                type="button"
                className="text-xs text-[#804040] underline opacity-90 hover:opacity-100 disabled:opacity-40"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await onDelete(post._id);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "…" : "Delete"}
              </button>
            ) : null}
            <ReportModal compact contentType="post" contentId={post._id} languageCode={languageCode} />
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#1B1C19]">
          {post.reply_to_author ? (
            <span className="mr-2 rounded-full bg-[#F0EEE9] px-2 py-0.5 text-xs font-semibold text-[#434843]">
              Replying to {post.reply_to_author}
            </span>
          ) : null}
          {post.body}
        </p>

        <ReactionBar counts={reactions} onReact={(emoji) => void onReact(post._id, emoji)} />

        <div className="flex flex-wrap items-center gap-2 border-t border-[#C3C8C1]/35 pt-3">
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D726D] hover:text-[#1B1C19]"
            onClick={() => setReplyOpen((v) => !v)}
          >
            Reply
          </button>
          {replies.length ? (
            <Badge className="border border-[#C3C8C1]/35 bg-transparent text-[10px] text-[#434843]">
              {replies.length} repl{replies.length === 1 ? "y" : "ies"}
            </Badge>
          ) : null}
        </div>

        {replyOpen ? (
          <div className="space-y-2 rounded-2xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-3">
            <Textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Reply to ${post.author_name}…`}
              className="bg-[#FBF9F4]"
            />
            <div className="flex items-center justify-between gap-2">
              {error ? <p className="text-xs text-rose-700">{error}</p> : <span />}
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const body = draft.trim();
                  if (!body) return;
                  setBusy(true);
                  setError(null);
                  try {
                    await onReply({ parentPostId: post._id, replyToAuthor: post.author_name, body });
                    setDraft("");
                    setReplyOpen(false);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to reply.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Posting..." : "Post reply"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {visibleReplies.length ? (
        <div className="mt-4 space-y-4">
          {visibleReplies.map((r) => (
            <PostCard
              key={r._id}
              post={r}
              getChildren={getChildren}
              languageCode={languageCode}
              depth={Math.min(depth + 1, 2)}
              onReact={onReact}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
          {!expandedReplies && extra > 0 ? (
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D726D] hover:text-[#1B1C19]"
              onClick={() => setExpandedReplies(true)}
            >
              Show {extra} more
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

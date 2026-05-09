"use client";

import { useMemo, useState } from "react";
import ReactionBar from "@/components/ReactionBar";
import ReportModal from "@/components/ReportModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Post, ReportReason } from "@/lib/types";

export default function PostCard({
  post,
  replies,
  onReact,
  onReport,
  onReply,
}: {
  post: Post;
  replies?: Post[];
  onReact: (postId: string, emoji: string) => Promise<void>;
  onReport: (postId: string, payload: { reason: ReportReason; details: string }) => Promise<void>;
  onReply?: (payload: { parentPostId: string; replyToAuthor: string; body: string }) => Promise<void>;
}) {
  const when = new Date(post.created_at).toLocaleString();
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});

  const markReported = (id: string) => {
    setReportedIds((prev) => ({ ...prev, [id]: true }));
  };

  const reportHandler = async (targetId: string, payload: { reason: ReportReason; details: string }) => {
    await onReport(targetId, payload);
    markReported(targetId);
  };

  const replyCount = replies?.length || 0;
  const replyLabel = useMemo(() => (replyCount === 1 ? "1 reply" : `${replyCount} replies`), [replyCount]);

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-tight text-[#061B0E]">{post.author_name}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#737973]">{when}</p>
        </div>
        {reportedIds[post._id] ? (
          <Badge className="shrink-0 border-[#8C7851]/30 bg-[#F0EEE9] text-[#434843]">Reported</Badge>
        ) : (
          <ReportModal compact onSubmit={(p) => reportHandler(post._id, p)} />
        )}
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#1B1C19]">
        {post.reply_to_author ? (
          <span className="mr-2 rounded-full bg-[#F0EEE9] px-2 py-0.5 text-xs font-semibold text-[#434843]">
            Replying to {post.reply_to_author}
          </span>
        ) : null}
        {post.body}
      </p>
      <ReactionBar reactions={post.reactions || {}} onReact={(emoji) => onReact(post._id, emoji)} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#C3C8C1]/35 pt-3">
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D726D] hover:text-[#1B1C19]"
          onClick={() => setReplyOpen((v) => !v)}
        >
          Reply {replyCount ? `· ${replyLabel}` : ""}
        </button>
      </div>

      {replyOpen && onReply ? (
        <div className="space-y-2 rounded-2xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-3">
          <Textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Write a reply to ${post.author_name}...`}
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

      {replies?.length ? (
        <div className="space-y-3 border-l-2 border-[#C3C8C1]/35 pl-4">
          {replies.map((reply) => (
            <Card key={reply._id} className="space-y-2 bg-[#FBF9F4] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-xl leading-tight text-[#061B0E]">{reply.author_name}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#737973]">
                    {new Date(reply.created_at).toLocaleString()}
                  </p>
                </div>
                {reportedIds[reply._id] ? (
                  <Badge className="shrink-0 border-[#8C7851]/30 bg-[#F0EEE9] text-[#434843]">Reported</Badge>
                ) : (
                  <ReportModal compact onSubmit={(p) => reportHandler(reply._id, p)} />
                )}
              </div>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#1B1C19]">{reply.body}</p>
              <ReactionBar reactions={reply.reactions || {}} onReact={(emoji) => onReact(reply._id, emoji)} />
            </Card>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

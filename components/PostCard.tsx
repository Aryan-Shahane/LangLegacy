"use client";

import ReactionBar from "@/components/ReactionBar";
import ReportModal from "@/components/ReportModal";
import type { Post } from "@/lib/types";

export default function PostCard({
  post,
  onReact,
  onReport,
}: {
  post: Post;
  onReact: (emoji: string) => Promise<void>;
  onReport: (payload: { reason: "inaccurate" | "offensive" | "spam" | "other"; details: string }) => Promise<void>;
}) {
  return (
    <article className="panel space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-100">{post.author_name}</p>
          <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</p>
        </div>
        <ReportModal compact onSubmit={onReport} />
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-200">{post.body}</p>
      <ReactionBar reactions={post.reactions || {}} onReact={onReact} />
    </article>
  );
}

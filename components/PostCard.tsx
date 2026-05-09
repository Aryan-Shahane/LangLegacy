"use client";

import ReactionBar from "@/components/ReactionBar";
import ReportModal from "@/components/ReportModal";
import { Card } from "@/components/ui/card";
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
  const when = new Date(post.created_at).toLocaleString();

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-tight text-[#061B0E]">{post.author_name}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#737973]">{when}</p>
        </div>
        <ReportModal compact onSubmit={onReport} />
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#1B1C19]">{post.body}</p>
      <ReactionBar reactions={post.reactions || {}} onReact={onReact} />
    </Card>
  );
}

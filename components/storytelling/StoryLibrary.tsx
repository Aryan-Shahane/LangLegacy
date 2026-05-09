"use client";

import { useCallback, useEffect, useState } from "react";
import StoryCard from "@/components/storytelling/StoryCard";
import StoryComposer from "@/components/storytelling/StoryComposer";
import StoryPlayer from "@/components/storytelling/StoryPlayer";
import { Card } from "@/components/ui/card";
import type { Story } from "@/lib/types";

export default function StoryLibrary({ languageCode }: { languageCode: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<Story | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/stories?language_code=${encodeURIComponent(languageCode)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Failed to load stories.");
    }
    const docs = ((await res.json()) as Story[]).filter((s) => s.status !== "removed");
    setStories(docs);
  }, [languageCode]);

  useEffect(() => {
    let m = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (e) {
        if (m) setError(e instanceof Error ? e.message : "Error");
      }
      if (m) setLoading(false);
    })();
    return () => {
      m = false;
    };
  }, [load]);

  const reactFor = async (storyId: string, emoji: string) => {
    await fetch(`/api/stories/${storyId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <StoryComposer languageCode={languageCode} onCreated={load} />
      {focused ? (
        <div className="space-y-2">
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D726D] hover:text-[#1B1C19]"
            onClick={() => setFocused(null)}
          >
            ← Back to library
          </button>
          <StoryPlayer story={focused} />
        </div>
      ) : (
        <>
          {loading ? <p className="text-sm text-[#434843]">Loading stories…</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          {!loading && !error && stories.length === 0 ? (
            <Card className="p-6 text-center text-sm text-[#434843]">No stories recorded for this archive yet.</Card>
          ) : null}
          <div className="grid gap-6 md:grid-cols-2">
            {stories.map((s) => (
              <StoryCard
                key={s._id}
                story={s}
                languageCode={languageCode}
                onListen={() => setFocused(s)}
                onReact={(emoji) => reactFor(s._id, emoji)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

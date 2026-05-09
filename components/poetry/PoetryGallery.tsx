"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PoemCard from "@/components/poetry/PoemCard";
import PoemComposer from "@/components/poetry/PoemComposer";
import type { Language, Poem } from "@/lib/types";

export default function PoetryGallery({ languageCode }: { languageCode: string }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const languageDisplayName = useMemo(() => {
    const code = languageCode.trim().toLowerCase();
    const hit = languages.find((l) => l.code.trim().toLowerCase() === code);
    return hit?.name?.trim() || languageCode.trim().toUpperCase() || "this language";
  }, [languages, languageCode]);

  useEffect(() => {
    let m = true;
    void fetch("/api/languages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((json) => {
        if (m && Array.isArray(json)) setLanguages(json as Language[]);
      })
      .catch(() => {});
    return () => {
      m = false;
    };
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/poetry?language_code=${encodeURIComponent(languageCode)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Failed to load poetry.");
    }
    const docs = ((await res.json()) as Poem[]).filter((p) => p.status !== "removed");
    setPoems(docs);
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

  const reactFor = async (poemId: string, emoji: string) => {
    await fetch(`/api/poetry/${poemId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    await load();
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4 md:col-span-2">
        <PoemComposer
          languageCode={languageCode}
          languageDisplayName={languageDisplayName}
          onCreated={load}
        />
        {loading ? <p className="text-sm text-[#434843]">Loading poetry…</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
      {poems.map((p) => (
        <PoemCard
          key={p._id}
          poem={p}
          languageCode={languageCode}
          languageDisplayName={languageDisplayName}
          onReact={(emoji) => reactFor(p._id, emoji)}
        />
      ))}
    </div>
  );
}
